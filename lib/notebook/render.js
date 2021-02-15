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

        let cell = $(`<div class="docable-cell docable-cell-${el.data('type')}">`);
        let overlay = $(`<div class="docable-cell-overlay">`);
    
        // overlay is parent to pre block
        el.wrap(overlay);
        // cell is parent to overlay
        overlay.wrap(cell);
    
        if( !isHosted )
        {
            let more_btn = `<i class="fas fa-ellipsis-v docable-overlay-btn-reveal btn-more"></i>`;
            overlay.append(more_btn);
        }
    
        if( executable )
        {
            let play_btn;

            // render repl/terminal UI
            if (el.data('type') === 'repl')
            {
                // console.log('found repl block', el.attr('id'), sessionId);
                // console.log('found repl block', sessionId);

                let elIDWithoutDash = el.attr('id').replace(/-/g, '');
                el.append(`<script> 
                    const socket${elIDWithoutDash} = io(\`\${window.location.hostname}\:\${window.location.port}\`, {transports: ['websocket'], secure: true});
                    socket${elIDWithoutDash}.emit('connect to room', { notebookUrl: window.location.pathname, target: '${el.data('target')}' });
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
            overlay.append(play_btn);
        }
    
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

        // insert sideannotation before pre block.
        $(`<div class="sideAnnotation">[${$(elem).data('type')}:]${$(elem).data('target') ? `<br><div>target:${$(elem).data('target')}</div>` : ''} </div>`).insertBefore(overlay)
    
        // insert output block
        cell.append('<div class="docable-cell-output">');
    
        return cell;
    }

}

module.exports = new NotebookRender();