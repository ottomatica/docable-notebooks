const path = require('path');
const cheerio = require('cheerio');
const docable = require('docable');
const slash = require('slash');

const notebookSlug = require('../notebook/slug');

const policy = require('./policy');

var uuid = require('uuid');

const isHosted = process.env.NODE_ENV == "prod" ? true: false;

class NotebookRender
{
    async notebookRender(session, rootDir, md, ir) {

        let neededVariables = new Set();
        let IR;
        let html;
        let self = this;
        try{
            IR = ir || await docable.transformers.inline.transform(Buffer.from(md, 'utf-8'));
    
            const $ = cheerio.load(IR);
            $('[data-docable="true"]').each(function (index, elem) {
    
                let cell = self.renderCell($(elem), $, policy.isExecutable($(elem), session.notebooks.setup) );

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

    async renderCell(elem, $, executable)
    {
        // make docable cell content editable
        if(!isHosted)
            elem.attr('contenteditable', 'true');

        let el = $(elem);

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
            if( el.data('type') === 'file' )
            {
                play_btn = `<button class="far fa-edit docable-overlay-btn play-btn"></button>`
            }
            else if (el.data('type') === 'edit') 
            {
                play_btn = `<button class="far fa-edit docable-overlay-btn play-btn"></button>`
            }
            else
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
    
        // insert sideannotation before pre block.
        $(`<div class="sideAnnotation">[${$(elem).data('type')}:]</div>`).insertBefore(overlay)
    
        // insert output block
        cell.append('<div class="docable-cell-output">');
    
        return cell;
    }

}

module.exports = new NotebookRender();