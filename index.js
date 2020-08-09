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

const pino = require('pino');
const expressPino = require('express-pino-logger');
const logger = pino(pino.destination({
    dest: './docable-notebooks.log',
    sync: false
}));
const expressLogger = expressPino({ logger });

const CONTAINER_TIMEOUT = 600000;
let timeoutQ = {};

const utils = require('./lib/utils');
const port = process.env.PORT || "3000";

const app = express();

app.use(session({
    secret: "Shh, its a secret!",
    resave: true,
    rolling: true,
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

app.use(expressLogger);

if (process.env.NODE_ENV == 'dev') {
    logger.info(`Enabling arbitrary md in /`);
    app.use('/', express.static(__dirname + '/public/'));

    app.post('/run', async function (req, res) {
        // res.send('Got a POST request')
    
        const notebookMdPath = path.join(os.tmpdir(), uuidv4());

        logger.info(`Writing input notebook in a temp file`);
        await fs.promises.writeFile(notebookMdPath, req.body.markdownContent, { encoding: 'utf-8' });
    
        let results;
        try{
            logger.info(`Running docable on ${notebookMdPath}`);
            results = await docable.docable({ doc: notebookMdPath, stepIndex: req.body.stepIndex });
        }
        catch (err) {
            logger.error(err);
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
            if (await conn.containerExists()) {
                logger.info(`Deleting session's previous container: ${req.session.container}`);
                await conn.delete();
            }
        }

        // create new container for this notebook + session
        logger.info(`Available memory: ${Number.parseFloat(100 * os.freemem() / os.totalmem()).toFixed(2)}%`);
        logger.info(`Creating new container: ${containerName}`);
        await conn.run('ubuntu:18.04', '/bin/bash');

        // setting current container name for session 
        req.session.container = containerName;
    }

    else {
        // resetting timeout
        logger.info(`Cancelling timer for killing container: ${containerName}`);
        clearTimeout(timeoutQ[containerName])
    }

    // setting timeout
    timeoutQ[containerName] = timeoutContainer(containerName, CONTAINER_TIMEOUT);

    const exampleName = req.body.name;
    const notebookMdPath = path.join(__dirname, 'examples', exampleName + '.md');

    let results;
    try {
        logger.info(`Running docable on ${notebookMdPath} inside ${containerName} container`);
        results = await docable.docable({ doc: notebookMdPath, stepIndex: req.body.stepIndex, setupObj: { docker: containerName } });
    }
    catch (err) {
        logger.error(err);
    }

    res.setHeader('Content-Type', 'text/plain');

    // can't send cheerio selector in response
    results = results.map(res => {
        return { result: res.result, cell: { ...res.cell, elem: undefined } }
    });
    
    logger.info(`Docable results: ${JSON.stringify(results)}`);

    res.send(results);
});

app.post('/markdown', async function (req, res) {
    logger.info(`Rendering example: \n${req.body}`);
    const { html, IR, md } = await utils.notebookRender(req.body);

    res.setHeader('Content-Type', 'text/plain');
    res.send({ html, IR, md });
});

// render specific example
app.get('/examples/:name', async function (req, res) {
    const name = req.params.name;
    try {
        logger.info(`Finding example: ./examples/${name}.md`);
        const example = await utils.getExamples(name);

        logger.info(`Rendering example: ./examples/${name}.md`);
        const { html, IR, md } = await utils.notebookRender(example);

        res.render("index", { notebookHtml: html, md });
    }
    catch (err) {
        logger.warn(err);
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
        logger.info(`Finding example: ./examples/${name}.md`);
        const example = await utils.getExamples(name);
        res.setHeader('Content-Type', 'text/plain');
        res.send(example);
    }
    catch (err) {
        logger.warn(err);
        res.status(404);
        res.send(`Example ${name} not found!`);
    }
});

app.listen(port, async () => {
    const conn = Connectors.getConnector('docker', 'foo');
    
    logger.info(`Pulling latest version of docker image: ubuntu:18.04`);
    await conn.pull('ubuntu:18.04');

    logger.info(`Server started in ${process.env.NODE_ENV} NODE_ENV`);
    logger.info(`Listening to requests on http://localhost:${port}`);
});

function timeoutContainer(name, timeout) {
    logger.info(`Setting timer for killing container in ${timeout}ms: ${name}`);

    const conn = Connectors.getConnector('docker', name);
    return setTimeout(async () => {
        await conn.delete();
    }, timeout);
}

process.on('uncaughtException', pino.final(logger, (err, finalLogger) => {
    finalLogger.error(err, 'uncaughtException');
}));

process.on('unhandledRejection', pino.final(logger, (err, finalLogger) => {
    finalLogger.error(err, 'unhandledRejection');
}));
