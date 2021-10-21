const path = require('path');
const cheerio = require('cheerio');
const docable = require('docable');
const slash = require('slash');
const utils = require('../utils');

const notebookSlug = require('../notebook/slug');

const policy = require('./policy');

var uuid = require('uuid');

const isHosted = process.env.NODE_ENV == "prod" ? true: false;

class NotebookRender
{
    async notebookRender(session, notebookUrl, rootDir, md, ir) {

        let neededVariables = new Set();
        let IR;
        let html;
        let self = this;
        try{
            IR = ir || await docable.transformers.inline.transform(Buffer.from(md, 'utf-8'));
    
            const $ = cheerio.load(IR);
            $('[data-docable="true"]').each(function (index, elem) {

                let cell = self.renderCell($(elem), $, policy.isExecutable($(elem), session.notebooks[notebookUrl].currentEnvironment), session.id);

                // getting list of used variables in this notebook
                let vars = $(elem).data('variables');
                if (vars) {
                    vars.split(',').map(v => v.trim()).forEach(v => {
                        neededVariables.add(v)
                    });
                }
            });
    
            // render svg blocks
            $('pre').each(function (index, elem) {
    
                if( $(elem).hasClass("language-svg") )
                {
                    let text = $(elem).text();
                    console.log(text);
                    $(elem).wrap(`<div class="svg-container"></div>`);
                    $(elem).parent().append(`<div class="svg-preview">${text}</div>`);
                }
            });
            // Rewrite relative imgs to be use media slug.
            let baseDir = "";
            if( rootDir != ".") baseDir = rootDir;

            $('img').each(function () {
                const link = $(this).attr('src');
                if (!link.startsWith('http') && !link.startsWith('//')) {
                    let fixedUrl = slash(path.normalize(path.join('/', baseDir, link)));
                    $(this).attr('src', fixedUrl);
                }
            });
            // Rewrite relative links to markdown items to use notebook slug
            $('a').each(function () {
                const link = $(this).attr('href');
                if (link && link.match(/[.]md[#]?/) && !link.startsWith('http') && !link.startsWith('//')) {
                    let fixedUrl = slash(path.normalize(path.join('/', baseDir, link)));
                    $(this).attr('href', fixedUrl);
                }
            });

            html = $.html();
        } catch (err) {
            console.log('err', err)
        }

        return { html, IR, md, neededVariables: Array.from(neededVariables) }
    }

    _highlightRange(el, range)
    {
        let val = el.html();
        let lines = val.split(/\r?\n/g);
        if( lines.length >= range.end )
        {
            let fnInclude = (i, range) => {
                return i >= range.start && i <= range.end;
            }

            el.html( 
                lines.map( function(line, idx) {
                    if( fnInclude(idx,range )  )
                        return `<span style="background-color:rgb(240,228,192);">${line}</span>`;
                    return line;
                }).join('\n')
            );

        }        
    }

    async renderCell(elem, $, executable, sessionId)
    {
        let el = $(elem);
        
        // make docable cell content editable
        if (!['quiz', 'file', 'script', 'info'].includes(el.data('type')) && (!isHosted || process.env.DOCABLE_CONTENTEDITABLE))
            elem.attr('contenteditable', 'true');

        // encrypt quiz answers attribute
        if (el.data('type') == 'quiz' && sessionId) {
            el.attr('data-quiz_answers', utils.encryptWithKey(el.attr('data-quiz_answers'), sessionId));
            el.addClass('card p-1 mb-1');
        }

        if( el.data("range") )
        {
            this._highlightRange(el, el.data("range") );
        }

        el.attr('id', uuid.v4() );

        {
            // renaming it to "terminal" if it was repl
            // note: keeping repl type for backward compatibility but should use terminal from now
            if (el.data('type') === 'repl')
                el.data('type', 'terminal');
        }

        let cell = $(`<div class="d-flex flex-row docable-cell docable-cell-${el.data('type')}">`);
        let container = $(`<div id="container" class="flex-grow-1 d-flex flex-column"></div>`)
        let overlay = $(`<div class="docable-cell-overlay">`);
    
        // overlay is parent to pre block
        el.wrap(overlay);
        // container is parent to overlay
        overlay.wrap(container);
        // cell is parent to container
        container.wrap(cell);
    
        let btnContainer = $(`<div class="d-flex flex-row position-absolute docable-overlay-btn-container" style="top: 0; right: 0;"></div>`);

        // Edit button:
        // if (!isHosted) {
        //     let more_btn = `<i class="fas fa-ellipsis-v docable-overlay-btn-reveal btn-more"></i>`;
        //     cellBtnOverlay.append(more_btn);
        // }

        if( executable )
        {
            let play_btn;

            // render repl/terminal UI
            if (el.data('type') === 'terminal')
            {
                let elIDWithoutDash = el.attr('id').replace(/-/g, '');
                el.append(`<script> 
                    const socket${elIDWithoutDash} = io(\`\${window.location.hostname}\:\${window.location.port}\`, {transports: ['websocket'], secure: true});
                    socket${elIDWithoutDash}.emit('connect to room', { notebookUrl: window.location.pathname, target: '${el.data('target')}', command: ${el.data('command') ? "'" + el.data('command') + "'" : el.data('lang') ? "'" + el.data('lang') + "'" : 'undefined'} });
                    new TerminalUI(socket${elIDWithoutDash}, $('#${el.attr('id')}').parent('.docable-cell-overlay')[0], ${el.data('background-color') ? "'" + el.data('background-color') + "'" : 'undefined' });
                    $('#${el.attr('id')}').parent('.docable-cell-overlay').removeClass('docable-cell-overlay');
                    $('#${el.attr('id')}').remove();
                </script>`);
            }
            else if( el.data('type') === 'file' )
            {
                play_btn = `<button class="far fa-edit docable-overlay-btn play-btn"></button>`
            }
            else if (el.data('type') === 'edit') 
            {
                play_btn = `<button class="far fa-edit docable-overlay-btn play-btn"></button>`
            }
            else if (el.data('type') === 'quiz')
            {
                play_btn = `<button class="fas fa-check-circle docable-overlay-btn play-btn"></button>`;
            }
            else if (el.data('type') != 'info' && el.data('type') != 'playground')
            {
                play_btn = `<button class="far fa-play-circle docable-overlay-btn play-btn"></button>`
            }
            btnContainer.append(play_btn);
        }

        overlay.append(btnContainer);

        // let copy_btn = `<button class="far fa-copy docable-overlay-btn copy-btn"></button>`;
        // overlay.append(copy_btn);
    
        // insert file docable-cell-file-header
        if( el.data('type') === 'file' )
        {
            $(`<div class="docable-cell-file-header">${el.data('path')}</div>`).insertBefore(overlay)
        }

        if(el.data('type') === 'file' || el.data('type') === 'script') {
            let elIDWithoutDash = el.attr('id').replace(/-/g, '');

            el.addClass('pl-0');
            el.after(
                `<script>
                    require(['vs/editor/editor.main'], function () {
                        monaco.editor.defineTheme('docable', {
                            base: 'vs',
                            inherit: true,
                            rules: [{ background: 'f6f8fa' }],
                            colors: {
                                'editor.background': '#f6f8fa'
                            }
                        });
                        let el_${elIDWithoutDash} = $('#${el.attr('id')}');
                        let ell_${elIDWithoutDash} = el_${elIDWithoutDash}[0];
                        let text_from_${elIDWithoutDash} = el_${elIDWithoutDash}.text();
                        el_${elIDWithoutDash}.empty();
                        window.m_${elIDWithoutDash} = monaco.editor.create(el_${elIDWithoutDash}[0], {
                            value: text_from_${elIDWithoutDash},
                            language: "${el.data('lang') == 'js' ? 'javascript' : el.data('lang')}",
                            automaticLayout: true,
                            minimap: {
                                enabled: false
                            },
                            theme: 'docable',
                            scrollBeyondLastLine: false,
                            overviewRulerLanes: 0,
                            fixedOverflowWidgets: true,
                            automaticLayout: true,
                            lineNumbers: ${el.data('type') == 'file' ? true : false},
                            quickSuggestions: { other: true, comments: true, strings: true }
                        });

                        window.m_${elIDWithoutDash}.onDidContentSizeChange(() => $('#${el.attr('id')}').height(Math.min(480, Math.max(45, window.m_${elIDWithoutDash}.getContentHeight()) )));

                        // fix shrink issue for responsive layout
                        window.m_${elIDWithoutDash}.layout({width: 0}); 
                        window.addEventListener('resize', ()=>{
                            window.m_${elIDWithoutDash}.layout({width: 0});
                        })

                        ${
                            // autosave on focusout + modified file
                            el.data('type') === 'file' ?
                            `window.m_${elIDWithoutDash}.onDidChangeModelContent(() => {
                                window.m_${elIDWithoutDash}.isDirty = true;
                                window.isDirty = true;
                            });
                            window.m_${elIDWithoutDash}.onDidBlurEditorText(() => {
                                if(window.m_${elIDWithoutDash}.isDirty) $('#${el.attr('id')}').parent().find('.play-btn').trigger('click');
                                window.m_${elIDWithoutDash}.isDirty = false;
                            });`
                            : ''
                        }
                    });

                </script>`
            );
            // https://github.com/microsoft/monaco-editor/issues/794#issuecomment-688959283 
        }

        if (el.data('type') === 'playground') {
            let elIDWithoutDash = el.attr('id').replace(/-/g, '');

            // making the cell hidden because it will be overwritten in frontend
            el.addClass('d-none');
            
            const playground = 
            `
            <div class='d-flex flex-row'>
                <div class="docable-playground-header-tabs">
                    <div class="docable-playground-header-tab d-flex">
                        <div>
                            HTML 
                        </div>
                        <svg width="20" height="20" class="my-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                            <title>HTML5 Logo</title>
                            <path
                                d="M108.4 0h23v22.8h21.2V0h23v69h-23V46h-21v23h-23.2M206 23h-20.3V0h63.7v23H229v46h-23M259.5 0h24.1l14.8 24.3L313.2 0h24.1v69h-23V34.8l-16.1 24.8l-16.1-24.8v34.2h-22.6M348.7 0h23v46.2h32.6V69h-55.6" />
                            <path fill="#e44d26" d="M107.6 471l-33-370.4h362.8l-33 370.2L255.7 512" />
                            <path fill="#f16529" d="M256 480.5V131H404.3L376 447" />
                            <path fill="#ebebeb"
                                d="M142 176.3h114v45.4h-64.2l4.2 46.5h60v45.3H154.4M156.4 336.3H202l3.2 36.3 50.8 13.6v47.4l-93.2-26" />
                            <path fill="#fff"
                                d="M369.6 176.3H255.8v45.4h109.6M361.3 268.2H255.8v45.4h56l-5.3 59-50.7 13.6v47.2l93-25.8" />
                        </svg>
                    </div>
                </div>

                <div class="docable-playground-header-badges d-flex flex-row ml-auto">
                    <div onclick="livePreviewToggle('${elIDWithoutDash}')" class="docable-playground-header-badge docable-playground-header-badge-preview enabled badge badge-pill btn btn-light my-auto"> Live Preview </div>
                    <div onclick="livePreviewRefresh('${elIDWithoutDash}')" class="docable-playground-header-badge docable-playground-header-badge-refresh badge badge-pill btn btn-light my-auto"> Refresh </div>
                </div>
            </div>

            <div class="mb-2">
                <div class="d-flex flex-column" style="border: 1px solid lightgray; border-radius: 0 5px 5px 5px;">
                    <div class="bg-light" style="height: 300px; min-height: 100px" id="html_playground_content_${elIDWithoutDash}"></div>
                    <div class="w-100 html_playground_content_resizer" id="html_playground_content_resizer_${elIDWithoutDash}"></div>
                    <iframe style="min-width: 300px" frameBorder="0" id="html_playground_preview_${elIDWithoutDash}"></iframe>
                    <div class="w-100 html_playground_preview_resizer" id="html_playground_preview_resizer_${elIDWithoutDash}"></div>
                </div>

                <script>
                
                    makeResizer('html_playground_content_resizer_${elIDWithoutDash}', '${elIDWithoutDash}');
                    makeResizer('html_playground_preview_resizer_${elIDWithoutDash}', '${elIDWithoutDash}');

                    const html_playground_content_${elIDWithoutDash} = document.getElementById('html_playground_content_${elIDWithoutDash}');
                    const html_playground_preview_${elIDWithoutDash} = document.getElementById('html_playground_preview_${elIDWithoutDash}');
                    window.html_playground_preview_height_is_dirty_${elIDWithoutDash} = false;

                    //=========
                    // dynamically update the iframe preview height
                    html_playground_preview_${elIDWithoutDash}.onload = function () {
                        if(!window.html_playground_preview_height_is_dirty_${elIDWithoutDash}) {
                            let html_playground_preview_height = html_playground_preview_${elIDWithoutDash}.contentWindow.document.body.scrollHeight + 100;
                            html_playground_preview_${elIDWithoutDash}.style.height = (html_playground_preview_height > 600 ?  600 : html_playground_preview_height ) + 'px';
                        }
                    };
                    //========

                    require(['vs/editor/editor.main'], function () {
                        monaco.editor.defineTheme('docable', {
                            base: 'vs',
                            inherit: true,
                            rules: [{ background: 'f6f8fa' }],
                            colors: {
                                'editor.background': '#f6f8fa'
                            }
                        });

                        let el_${elIDWithoutDash} = $('#${el.attr('id')}');
                        let text_from_${elIDWithoutDash} = htmlDecode(el_${elIDWithoutDash}.find('code').html());
                        window.html_playground_${elIDWithoutDash} = monaco.editor.create(html_playground_content_${elIDWithoutDash}, {
                            value: text_from_${elIDWithoutDash},
                            language: "html",
                            automaticLayout: true,
                            minimap: { enabled: false },
                            theme: 'docable',
                            scrollBeyondLastLine: false,
                            overviewRulerLanes: 0,
                            fixedOverflowWidgets: true,
                            lineNumbers: true,
                            quickSuggestions: { other: true, comments: true, strings: true }
                        });

                        html_playground_preview_${elIDWithoutDash}.srcdoc = text_from_${elIDWithoutDash};

                        window.LivePreviewEvent_${elIDWithoutDash};
                        window.livePreviewIsEnabled_${elIDWithoutDash} = false;

                        // update preview on load
                        livePreviewToggle('${elIDWithoutDash}');


                        document.addEventListener('RUNNING', function (e) {
                            setTimeout(() => {
                                html_playground_preview_${elIDWithoutDash}.srcdoc = window.html_playground_${elIDWithoutDash}.getValue();
                            }, 3000);
                        });

                        // fix shrink issue for responsive layout
                        window.addEventListener('resize', () => {
                            window.html_playground_${elIDWithoutDash}.layout({ width: 0 });
                        })
                    });
                </script>
            </div>`;

            el.addClass('p-0');
            el.after(playground);
        }

        if (el.data('type') === 'youtube') {
            const url = el.data('url') || el.text();
            cell.html(`
            <div class="d-flex justify-content-center">
                <iframe width="${el.data('width') || 560}" height="${el.data('height') || 315}" src="${url}?autoplay=${el.data('autoplay') ? 1 : 0}&mute=${el.data('mute') ? 1 : 0}&start=${el.data('start') || 0}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe> 
            </div>`);
        }

        if (el.data('type') == 'slides') {
            const url = el.data('url') || el.text();
            cell.html(`
            <div class="d-flex justify-content-center">
                <iframe width="${el.data('width') || 960}" height="${el.data('height') || 569}" src="${url}" frameborder="0" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>
            </div>`);
        }

        // insert sideannotation before pre block.
        $(`<div class="sideAnnotation">[${$(elem).data('type')}:]${$(elem).data('target') ? `<br><div>target:${$(elem).data('target')}</div>` : ''} </div>`).insertBefore(container)
    
        // insert output block
        container.append('<div class="docable-cell-output">');
    
        return cell;
    }

}

module.exports = new NotebookRender();