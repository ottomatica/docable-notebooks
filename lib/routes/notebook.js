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

exports.viewCell = async function(req, res) {

    let ir = await docable.transformers.inline.transform(Buffer.from(req.body.markdownContent, 'utf-8'));
    const $ = cheerio.load(ir);

    let cell = $('[data-docable="true"]').eq(req.body.stepIndex);


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

    const $ = cheerio.load(req.body.text);
    console.log( req.body.text );

    const session = req.session;

    let cells = [];
    $('[data-docable="true"]').each(function (index, elem) {
        cells.push({
            index: req.body.stepIndex,
            content: $(elem).text().trim(),
            ...$(elem).data(),
            elem
        });
    });

    console.log( cells );

    if( session.notebooks )
    {
        let stepper = new docable.Stepper();
        let conn = await stepper.buildConnector(session.notebooks.setup, session.notebooks.cwd);
  
        let { results, _, status } = await stepper.runStep( cells, $, conn, session.notebooks.cwd, undefined);

        results = results.map(res => {
            return { result: { ...res.result, stdout: res.result.stdout.replace('\n', '<br>'), stderr: res.result.stderr.replace('\n', '<br>')} , cell: { ...res.cell, elem: undefined } }
        });

        // results = [{result: {stderr:'',stdout:'',status:true}}];
        
        res.send(results);
    }
    else {
        res.status(500);
        res.send(`Notebook session not found!`);
    }
}


exports.runUnsafe = async function (req, res) {
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
        return { result: { ...res.result, stdout: res.result.stdout.replace('\n', '<br>'), stderr: res.result.stderr.replace('\n', '<br>')} , cell: { ...res.cell, elem: undefined } }
    });
    
    res.send(results);
}

exports.runIndex = async function (req, res) {

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
        return { result: { ...res.result, stdout: res.result.stdout.replace('\n', '<br>'), stderr: res.result.stderr.replace('\n', '<br>')} , cell: { ...res.cell, elem: undefined } }
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