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
            // add parent
            el.wrap(`<div class="docable-cell docable-cell-${el.data('type')}">`);

            // insert sideannotation before pre block.
            $(`<div class="sideAnnotation">[${$(elem).data('type')}:]</div>`).insertBefore(elem)

            // insert output block
            el.parent().append('<div class="docable-cell-output">');

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
