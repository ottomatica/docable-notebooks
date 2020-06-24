const express = require("express");
const path = require("path");
const fs = require('fs');
const testreport = require('docable');
const child_process = require('child_process');

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
    // console.log(req.body);
    // res.send('Got a POST request')

    fs.writeFileSync('/tmp/notebook.md', req.body, {encoding: 'utf-8'});
    fs.copyFileSync(path.join(__dirname, 'resources/steps.yml'), '/tmp/steps.yml');

    // await testreport("report", { stepfile: '/tmp/steps.yml' });


    try{
        let logs = child_process.execSync(`cd / && /bakerx/node_modules/.bin/docable report /tmp/steps.yml`);
        console.log(logs);
    }
    catch (err) {
        console.error('err: ', err);
    }

    const results = fs.readFileSync('/tmp/docable_results/notebook.html', {encoding: 'utf-8'});

    console.log(results);

    fs.unlinkSync('/tmp/docable_results/notebook.html')


    res.setHeader('Content-Type', 'text/plain');
    res.send(results);
})

app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});
