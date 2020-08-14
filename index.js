const path = require("path");
const fs = require('fs');
const os = require('os');

const yargs = require('yargs');
const argv = yargs
.option('notebook_dir', {
    alias: 'd',
    description: 'Serve notebooks from this directory on /notebooks',
    type: 'string',
}).help()
.alias('help', 'h')
.argv;

const port = process.env.PORT || "3000";
const notebook_dir = argv.notebook_dir;

// Initialize configure store and logger.
const env = require('./lib/env');
env.setup(notebook_dir);

let {config, logger } = env.vars();


const pino = require('pino');
const expressPino = require('express-pino-logger');
const expressLogger = expressPino({ logger });

const bodyParser = require("body-parser");
const express = require("express");
const notebook_routes = require('./lib/routes/notebook');
const workspace_routes = require('./lib/routes/workspace');


const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const DOCKER_IMAGE = 'node:12-buster';
const utils = require('./lib/utils');

const Connectors = require('infra.connectors');

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
    logger.info(`Enabling arbitrary md in /notebooks`);

    // app.use('/', express.static(__dirname + '/public/'));
    app.get('/', async function (req, res) {
        let notebooks = await utils.getNotebook(null, notebook_dir);
        let notebooks_urls = notebooks.map( nb => `/notebooks/${nb}`)
        res.render("home", { notebooks_urls });
    });

    app.post('/run', notebook_routes.runUnsafe);

    app.post('/viewCell', notebook_routes.viewCell);
    app.post('/editCell', notebook_routes.editCell);

    if( notebook_dir )
    {
        // list notebooks
        app.get('/notebooks/', workspace_routes.notebooks );

        // render notebook from notebook dir
        app.get('/notebooks/:name', workspace_routes.get_notebook );
    }
}

app.post('/runexample', notebook_routes.runIndex);
app.post('/markdown', notebook_routes.render);

// render specific example
app.get('/examples/:name', async function (req, res) {
    const name = req.params.name;
    try {
        logger.info(`Finding example: ./examples/${name}.md`);
        const example = await utils.getExamples(name);

        logger.info(`Rendering example: ./examples/${name}.md`);
        const { html, IR, md } = await utils.notebookRender(example);

        res.render("notebook", { notebookHtml: html, md });
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
    
    logger.info(`Pulling latest version of docker image: ${DOCKER_IMAGE}`);
    await conn.pull(DOCKER_IMAGE);

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
