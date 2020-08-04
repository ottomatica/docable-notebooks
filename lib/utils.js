const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const docable = require('docable');

async function notebookRender(md) {

    let IR;
    let html;
    try{
        IR = await docable.transformers.inline.transform(Buffer.from(md, 'utf-8'));

        const $ = cheerio.load(IR);
        $('[data-docable="true"]').each(function (index, elem) {

            let el = $(elem);

            let cell = $(`<div class="docable-cell docable-cell-${el.data('type')}">`);
            let overlay = $(`<div class="docable-cell-overlay">`);

            // overlay is parent to pre block
            el.wrap(overlay);
            // cell is parent to overlay
            overlay.wrap(cell);

            // add buttons
            let more_btn = 
            `<button class="docable-overlay-btn btn-more">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 560" id="more-icon-560" aria-hidden="true" class="option-menu">
            <path d="M350 280c0 38.634-31.366 70-70 70s-70-31.366-70-70 31.366-70 70-70 70 31.366 70 70m0-210c0 38.634-31.366 70-70 70s-70-31.366-70-70 31.366-70 70-70 70 31.366 70 70m0 420c0 38.634-31.366 70-70 70s-70-31.366-70-70 31.366-70 70-70 70 31.366 70 70"></path>
            </svg>
            </button>
            `;
            overlay.append(more_btn);

            let play_btn = 
            `
            <button class="docable-overlay-btn play-btn">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 26 26">
                <polygon class="play-btn__svg" points="9.33 6.69 9.33 19.39 19.3 13.04 9.33 6.69"/>
                <path class="play-btn__svg" d="M26,13A13,13,0,1,1,13,0,13,13,0,0,1,26,13ZM13,2.18A10.89,10.89,0,1,0,23.84,13.06,10.89,10.89,0,0,0,13,2.18Z"/>
                </svg> 
            </button>
            `
            overlay.append(play_btn);


            // insert sideannotation before pre block.
            $(`<div class="sideAnnotation">[${$(elem).data('type')}:]</div>`).insertBefore(overlay)

            // insert output block
            cell.append('<div class="docable-cell-output">');

        })
        html = $.html();
    } catch (err) {
        console.log('err', err)
    }

    return { html, IR, md }
}

async function getExamples(name) {

    const examplesDir = path.join(__dirname, '../examples');

    if (name) {
        try {
            return fs.promises.readFile(path.join(examplesDir, name + '.md'), { encoding: 'utf-8' });
        }
        catch (err) {
            throw 'example not found';
        }
    }

    // return list of available exampels
    else {
        return (await fs.promises.readdir(examplesDir)).filter(name => name.endsWith('.md'));
    }
}

// (async () => {
//     await getExamples()
// })()

module.exports = {notebookRender, getExamples};
