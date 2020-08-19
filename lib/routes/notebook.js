const path = require('path');
const fs   = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const cheerio = require('cheerio');

const env = require('../env');
const utils = require('../utils');

let {logger, notebook_dir, DOCKER_IMAGE, CONTAINER_TIMEOUT} = env.vars();

const Connectors = require('infra.connectors');
const docable = require('docable');

let timeoutQ = {};

// View cell as markdown
exports.viewCell = async function(req, res) {
    const $ = cheerio.load(req.body.text);
    let cell = $('[data-docable="true"]');

    res.setHeader('Content-Type', 'text/plain');
    res.send({ cell: cell2Markdown(cell) });
};

function cell2Markdown(cell)
{
    const getAllDataAttributes = function (node) {
        return Object.keys(node.attr())
            .filter(key => key.indexOf("data-") == 0)
            .reduce((obj, key) => {
                let dataKey = key.replace('data-','');
                obj[dataKey] = node.attr(key);
                return obj;
            }, {});
    }

    const getHighlightClass = function(node) {
        let value = node.attr('class')
        for( let klass of value.split(' '))
        {
            if( klass.indexOf('language-') == 0 )
                return klass.replace("language-", "");
        }
        return "";
    }

    // console.log( getAllDataAttributes(cell) );

    let highlight = getHighlightClass(cell);
    let attributes = "```" +highlight+"|"+JSON.stringify(getAllDataAttributes(cell));

    return attributes+"\n"+cell.text()+"\n```";
}

exports.editCell = async function(req, res) {

    let ir = await docable.transformers.inline.transform(Buffer.from(req.body.text, 'utf-8'));
    const $ = cheerio.load(ir);
    let newCell = utils.renderCell( $('[data-docable="true"]'), $)

    res.send($.html());
};

exports.runCell = async function(req, res) {
    run(req.body.text, req.body.stepIndex, req.session, res);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function run(text, stepIndex, session, res)
{
    const $ = cheerio.load(text);

    if( $('[data-stream="true"]').length > 0 )
    {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Transfer-Encoding', 'chunked');

        for( let x = 0; x < 10; x++ )
        {
            res.write(`Hello ${x}\n`);
        }
 
        setTimeout( () => res.end('Done'), 3000 );
    }
    else if( session.notebooks )
    {
        docable.fromHtml($, session.notebooks.setup, session.notebooks.cwd, session.notebooks.docDir).then(function(data)
        {
            let {results, _, status} = data;
            results = results.map(res => {
                let index = stepIndex || res.cell.index;
                return { result: { ...res.result, stdout: res.result.stdout, stderr: res.result.stderr} , cellindex: index }
            });
            res.send(results);

            if( status && $('[data-refresh="true"]').length > 0 )
            {
                process.env = utils.refreshEnv(process.env);
            }
        });        
    }
    else {
        res.status(500);
        res.send(`Notebook session not found!`);
    }
}

exports.runNotebook = async function (req, res) {
    run(req.body.notebook, undefined, req.session, res);
}

exports.runHosted = async function (req, res) {

    // create container for each session
    const containerName = `${req.body.name}-${req.session.id}`;
    const conn = Connectors.getConnector('docker', containerName);
    if (!(await conn.containerExists())) {
        // delete any other containers associated with this session 
        // (each session can have only 1 container at a time, to save resources)
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
        await conn.run(DOCKER_IMAGE, '/bin/sh');

        // setting current container name for session 
        req.session.container = containerName;
    }

    else {
        // resetting timeout
        logger.info(`Cancelling timer for killing container: ${containerName}`);
        clearTimeout(timeoutQ[containerName])
    }

    // setting timeout
    timeoutQ[containerName] = _timeoutContainer(containerName, CONTAINER_TIMEOUT);

    const exampleName = req.body.name;
    const notebookMdPath = path.join(__dirname, '../../', 'examples', exampleName);

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
        let index = res.cell.index;
        return { result: { ...res.result, stdout: res.result.stdout, stderr: res.result.stderr} , cellindex: index }
    });
    
    logger.info(`Docable results: ${JSON.stringify(results)}`);

    res.send(results);
};

exports.render = async function (req, res) {
    logger.info(`Rendering example: \n${req.body}`);
    const { html, IR, md } = await utils.notebookRender(req.body);

    res.setHeader('Content-Type', 'text/plain');
    res.send({ html, IR, md });
};

function _timeoutContainer(name, timeout) {
    logger.info(`Setting timer for killing container in ${timeout}ms: ${name}`);

    const conn = Connectors.getConnector('docker', name);
    return setTimeout(async () => {
        await conn.delete();
    }, timeout);
}
