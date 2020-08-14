const path = require('path');
const fs   = require('fs');
const os = require('os');
const { v4: uuidv4 } = require('uuid');

const env = require('../env');
const utils = require('../utils');

let {logger,notebook_dir} = env.vars();

const docable = require('docable');

exports.view = function(req, res) {


};

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