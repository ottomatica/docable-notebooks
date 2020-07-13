const express = require("express");
const path = require("path");
const fs = require('fs');
const testreport = require('docable');
const child_process = require('child_process');
const md2html = require('./lib/md2html')
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

    fs.writeFileSync('/tmp/notebook.html', req.body, {encoding: 'utf-8'});

    try{
        let logs = child_process.execSync(`./node_modules/.bin/docable notebook /tmp/notebook.html`);
        console.log(logs.toString());
    }
    catch (err) {
        console.error('err: ', err);
    }

    const results = fs.readFileSync('/tmp/notebook_results.html', {encoding: 'utf-8'});

    fs.unlinkSync('/tmp/notebook_results.html')

    res.setHeader('Content-Type', 'text/plain');
    res.send(results);
})

app.post('/markdown', async function (req, res) {
    const md = req.body;

    let html;
    try{
        html = md2html(md);
    } catch (err) { 
        console.log('err', err)
    }

    res.setHeader('Content-Type', 'text/plain');
    res.send(html);
});

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});
