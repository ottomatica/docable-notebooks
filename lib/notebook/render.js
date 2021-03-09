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
        if (el.data('type') == 'quiz' && sessionId)
            el.attr('data-quiz_answers', utils.encryptWithKey(el.attr('data-quiz_answers'), sessionId));

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

        let cell = $(`<div class="docable-cell docable-cell-${el.data('type')}">`);
        let overlay = $(`<div class="docable-cell-overlay">`);
    
        // overlay is parent to pre block
        el.wrap(overlay);
        // cell is parent to overlay
        overlay.wrap(cell);
    
        let btnContainer = $(`<div class="d-flex flex-row position-absolute docable-overlay-btn-container" style="top: 0; right: 0;"></div>`);

        // Edit button:
        // if (!isHosted) {
        //     let more_btn = `<i class="fas fa-ellipsis-v docable-overlay-btn-reveal btn-more"></i>`;
        //     cellBtnOverlay.append(more_btn);
        // }

        // if (!['quiz', 'file', 'script', 'info'].includes(el.data('type')) && (!isHosted || process.env.DOCABLE_CONTENTEDITABLE)) {
        //     let reset_btn = `<button class="fas fa-undo-alt docable-overlay-btn reset-btn"></i>`;
        //     btnContainer.append(reset_btn);
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
            else if (el.data('type') != 'info')
            {
                play_btn = `<button class="far fa-play-circle docable-overlay-btn play-btn"></button>`
            }
            btnContainer.append(play_btn);
        }

        overlay.append(btnContainer);

        // <button type="button" class="btn btn-secondary dropdown-toggle dropdown-toggle-split" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        //         <span class="sr-only">Toggle Dropright</span>
        //     </button>

        // border rounded 
        overlay.append(`
        <div class="sidebar-buttons d-flex flex-column">

            <i class="fas fa-angle-down mx-auto mb-1"></i>

            <div class="sidebar-buttons-menu" style="display: none; padding: 5px">
                <!-- Dropdown menu links -->
                <div class="d-flex flex-column">
                    
                    <button class="fas fa-undo-alt docable-overlay-btn pb-1"></i>
                    <button class="far fa-copy docable-overlay-btn"></i>
                </div>
            </div>
        </div>
        `)
        // <button class="far fa-play-circle docable-overlay-btn play-btn ml-0 pb-1"></button>

        // let copy_btn = `<button class="far fa-copy docable-overlay-btn copy-btn"></button>`;
        // overlay.append(copy_btn);
    
        // insert file docable-cell-file-header
        if( el.data('type') === 'file' )
        {
            $(`<div class="docable-cell-file-header">${el.data('path')}</div>`).insertBefore(overlay)
        }

        if(el.data('type') === 'file' || el.data('type') === 'script') {
            let elIDWithoutDash = el.attr('id').replace(/-/g, '');

            el.addClass('p-0');
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
                            lineNumbers: ${el.data('type') == 'file' ? true : false},
                            quickSuggestions: { other: true, comments: true, strings: true }
                        });

                        window.m_${elIDWithoutDash}.onDidContentSizeChange(() => $('#${el.attr('id')}').height(Math.min(480, Math.max(45, window.m_${elIDWithoutDash}.getContentHeight()) )));
                    });

                </script>`
            );
            // https://github.com/microsoft/monaco-editor/issues/794#issuecomment-688959283 
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
        $(`<div class="sideAnnotation">[${$(elem).data('type')}:]${$(elem).data('target') ? `<br><div>target:${$(elem).data('target')}</div>` : ''} </div>`).insertBefore(overlay)
    
        // insert output block
        cell.append('<div class="docable-cell-output">');
    
        return cell;
    }

}

module.exports = new NotebookRender();