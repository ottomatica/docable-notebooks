const express = require("express");
const path = require("path");
const fs = require('fs');
const os = require('os');
const Connectors = require('infra.connectors');
const docable = require('docable');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require("body-parser");
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const utils = require('./lib/utils');
const port = process.env.PORT || "3000";

const app = express();

app.use(session({
    secret: "Shh, its a secret!",
    resave: true,
    saveUninitialized: true,
    store: new SQLiteStore({db: '.sessions'})
}));
 
app.use(bodyParser.text({ type: 'text/plain' }))

// edit view:
app.set("views", path.join(__dirname, "views"));
app.set('view engine', 'ejs')

app.use('/js', express.static(__dirname + '/public/js'));
app.use('/css', express.static(__dirname + '/public/css'));

app.use(express.json());

if (process.env.NODE_ENV == 'dev') {
    app.use('/', express.static(__dirname + '/public/'));
    app.post('/run', async function (req, res) {
        // res.send('Got a POST request')
    
        const notebookMdPath = path.join(os.tmpdir(), uuidv4());
        await fs.promises.writeFile(notebookMdPath, req.body.markdownContent, { encoding: 'utf-8' });
    
        let results;
        try{
            results = await docable.docable({ doc: notebookMdPath, stepIndex: req.body.stepIndex });
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
    });
}

app.post('/runexample', async function (req, res) {

    // create container for each session
    const containerName = `${req.body.name}-${req.session.id}`;
    const conn = Connectors.getConnector('docker', containerName);
    if (!(await conn.containerExists())) {
        // delete any other containers associated with this session
        if (req.session.container) {
            const conn = Connectors.getConnector('docker', req.session.container);
            if (await conn.containerExists()) await conn.delete();
            console.log(`Deleted previous container: ${req.session.container}`);
        }

        // create new container for this notebook + session
        await conn.run('ubuntu:18.04', '/bin/bash');

        // setting current container name for session 
        req.session.container = containerName;
    }

    const exampleName = req.body.name;
    const notebookMdPath = path.join(__dirname, 'examples', exampleName + '.md');

    let results;
    try {
        results = await docable.docable({ doc: notebookMdPath, stepIndex: req.body.stepIndex, setupObj: { docker: containerName } });
    }
    catch (err) {
        console.error('err: ', err);
    }

    res.setHeader('Content-Type', 'text/plain');

    // can't send cheerio selector in response
    results = results.map(res => {
        return { result: res.result, cell: { ...res.cell, elem: undefined } }
    });
    
    res.send(results);
});

app.post('/markdown', async function (req, res) {
    const { html, IR, md } = await utils.notebookRender(req.body);

    res.setHeader('Content-Type', 'text/plain');
    res.send({ html, IR, md });
});

// get specific example
app.get('/examples/:name', async function (req, res) {
    const name = req.params.name;
    try {
        const example = await utils.getExamples(name);
        const { html, IR, md } = await utils.notebookRender(example);

        res.render("index", { notebookHtml: html, md });
    }
    catch (err) {
        console.log(err)
        res.status(404);
        res.send(`Example ${name} not found!`);
    }
});

// get list of available examples
app.get('/getexamples', async function (req, res) {
    const examples = (await utils.getExamples()).map(example => path.basename(example, '.md'));

    res.setHeader('Content-Type', 'application/json');
    res.send(examples);
});

// get specific example
app.get('/getexamples/:name', async function (req, res) {
    const name = req.params.name;
    try {
        const example = await utils.getExamples(name);
        res.setHeader('Content-Type', 'text/plain');
        res.send(example);
    }
    catch (err) {
        res.status(404);
        res.send(`Example ${name} not found!`);
    }

});

app.listen(port, async () => {
    const conn = Connectors.getConnector('docker', 'foo');
    await conn.pull('ubuntu:18.04');

    console.log(`Listening to requests on http://localhost:${port}`);
});
