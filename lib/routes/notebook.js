const path = require('path');
const cheerio = require('cheerio');

const env = require('../env');
const utils = require('../utils');

let {logger, notebook_dir, CONTAINER_TIMEOUT} = env.vars();

const docable = require('docable');

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

async function run(text, stepIndex, session, res)
{
    const $ = cheerio.load(text);

    if( session.notebooks )
    {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');

        let onProgress;
        if( $('[data-stream="true"]').length > 0 )
        {
            res.setHeader('Transfer-Encoding', 'chunked');

            onProgress = function(data) { res.write(data.toString()) }
        }

        // making variables obj: {variable_slug: variable_value}
        let variables = {};
        for(const v of utils.getVariables()) {
            variables[v.slug] = v.value;
        }

        docable.fromHtml($, session.notebooks.setup, session.notebooks.cwd, session.notebooks.docDir, onProgress, variables)
        .catch((err) => {
            if(err.message.includes('variable is not provided')){
                res.status(400);
                res.send(err.message);
            }
        })
        .then(function(data)
        {
            let {results, _, status} = data;
            results = results.map(res => {
                let index = stepIndex || res.cell.index;
                return { result: { ...res.result, stdout: res.result.stdout, stderr: res.result.stderr} , cellindex: index }
            });
            res.end(JSON.stringify(results));

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

    // reset container timeout:
    const containerName = `${req.body.name}-${req.session.id}`;
    utils.resetContainerTimeout(containerName, CONTAINER_TIMEOUT);

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