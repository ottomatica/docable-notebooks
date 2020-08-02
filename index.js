const express = require("express");
const path = require("path");
const fs = require('fs');
const os = require('os');
const docable = require('docable');
const { v4: uuidv4 } = require('uuid');
const cheerio = require('cheerio');

const {htmlUnescape} = require('escape-goat');
const app = express();
const port = process.env.PORT || "3000";
var bodyParser = require("body-parser");
app.use(bodyParser.text({ type: 'text/plain' }))

// edit view:
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "pug");

app.use(express.static(__dirname + '/public'));

app.get("/", (req, res) => {
    // res.status(200).send("Notebooks For DevOps");
    res.render("index", { title: "Notebook" });
});

app.post('/run', async function (req, res) {
    // res.send('Got a POST request')

    const notebookMdPath = path.join(os.tmpdir(), uuidv4());
    await fs.promises.writeFile(notebookMdPath, req.body, { encoding: 'utf-8' });

    let results;
    try{
        results = await docable.docable({ doc: notebookMdPath });
    }
    catch (err) {
        console.error('err: ', err);
    }

    fs.unlinkSync(notebookMdPath);

    res.setHeader('Content-Type', 'text/plain');

    // can't send cheerio selector in response
    results = results.map(res => {
        return { result: res.result, cell: { ...res.cell, elem: undefined } }
    });
    
    res.send(results);
})

app.post('/markdown', async function (req, res) {
    const md = req.body;

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
            `<button class="btn-more">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 560" id="more-icon-560" aria-hidden="true" class="option-menu">
            <path d="M350 280c0 38.634-31.366 70-70 70s-70-31.366-70-70 31.366-70 70-70 70 31.366 70 70m0-210c0 38.634-31.366 70-70 70s-70-31.366-70-70 31.366-70 70-70 70 31.366 70 70m0 420c0 38.634-31.366 70-70 70s-70-31.366-70-70 31.366-70 70-70 70 31.366 70 70"></path>
            </svg>
            </button>
            `;
            overlay.append(more_btn);

            let play_btn = 
            `
            <button class="play-btn">
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

    res.setHeader('Content-Type', 'text/plain');
    res.send({ html, IR });
});

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});
