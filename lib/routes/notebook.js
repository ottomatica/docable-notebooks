const path = require('path');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

const manager = require('../providers/manager');
const env = require('../env');
const utils = require('../utils');
const notebookRender = require('../notebook/render');

let {logger, notebook_dir, CONTAINER_TIMEOUT} = env.vars();

const docable = require('docable');

const policy = require('../notebook/policy');

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

exports.editCell = async function (req, res) {
    const notebookUrl = req.body.notebookUrl;

    let ir = await docable.transformers.inline.transform(Buffer.from(req.body.text, 'utf-8'));
    const $ = cheerio.load(ir);
    const elem = $('[data-docable="true"]');

    //TODO: fix notebookUrl
    let newCell = notebookRender.renderCell(elem, $, policy.isExecutable(elem, req.session.notebooks[notebookUrl].currentEnvironment));

    res.send($.html());
};

exports.runCell = async function(req, res) {
    // updating session variables
    req.session.variables = utils.updateSessionVariables(req.session.variables || [], req.body.pageVariables)

    const notebookUrl = req.body.notebookPath;

    run(req.body.text, req.body.stepIndex, notebookUrl, req.session, res);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run(text, stepIndex, notebookUrl, session, res)
{
    const $$ = cheerio.load(text);

    let html = "";
    $$('[data-docable=true]').each( function(index, element)
    {
        if( policy.isExecutable($$(element), session.notebooks[notebookUrl].currentEnvironment) )
        {
           html+= $$(element).parent().html();
        }
    });

    const $ = cheerio.load(html);

    if( session.notebooks[notebookUrl] )
    {
        // making variables obj: {variable_slug: variable_value}
        const variables = [...utils.getVariables(), ...session.variables];
        const secretVariables = variables.filter(v => v.isSecret);
        let DecryptedVariables = {};
        for (const variable of variables) {
            DecryptedVariables[variable.slug] = variable.value;
        }

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');

        let onProgress;
        if( $('[data-stream="true"]').length > 0 )
        {
            res.setHeader('Transfer-Encoding', 'chunked');

            onProgress = function (data) { res.write(maskSecrets(secretVariables, data.toString())) }
        }

        const currentEnvironment = session.notebooks[notebookUrl].currentEnvironment;
        const setupObj = { targets: currentEnvironment.type.includes('multi') ? currentEnvironment.targets : [currentEnvironment] }

        docable.fromHtml($, setupObj, undefined, session.notebooks[notebookUrl].docDir, onProgress, DecryptedVariables)
        .catch((err) => {
            if( err.message ) {
                // && err.message.includes('variable is not provided')){
                res.status(400);
                res.send(err.message);
            }
        })
        .then(function(data)
        {
            if( data === undefined )
            {
                res.status(400);
                res.end("Execution failed.");
                return;
            }
            let {results, _, status} = data;
            results = results.map(res => {
                let index = stepIndex || res.cell.index;

                // masking secrets in output
                res.result.stdout = maskSecrets(secretVariables, res.result.stdout);
                res.result.stderr = maskSecrets(secretVariables, res.result.stderr);

                return { result: { ...res.result, stdout: res.result.stdout, stderr: res.result.stderr} , cellindex: index, 
                         cellid: res.cell.id }
            });
            res.end(JSON.stringify(results));

            let refresh = $('[data-refresh="true"]').length > 0;
            console.log("refreshing =>" + refresh + " status => " + status);

            if( status && refresh )
            {
                process.env = manager.refreshEnv(process.env);
            }
        });
    }
    else {
        res.status(500);
        res.send(`Notebook session not found!`);
    }
}

exports.runNotebook = async function (req, res) {
    // updating session variables
    req.session.variables = utils.updateSessionVariables(req.session.variables || [], req.body.pageVariables)

    run(req.body.notebook, undefined, req.session, res);
}

exports.notebookHtml2Md = async function (req, res) {
    const turndownService = new TurndownService();

    const convertedMd = turndownService
        .remove((node, options) => node.classList.contains('sideAnnotation') ? true : false)
        .addRule('add docable annotations json', {
            filter: function (node, options) {
                if (node.nodeName === 'PRE' && node.getAttribute('data-docable')) {
                    return true;
                };
            },
            replacement: function (content, node, options) {
                const attributes = {};
                const supportedAttributesList = ['path', 'type', 'variables',
                                                    'privileged', 'platform', 'failed_when',
                                                    'stream', 'shell', 'tty', 'user', 'interactive',
                                                    'highlight', 'block', 'shell', 'permission',
                                                    'range', 'spawn', 'refresh'];

                supportedAttributesList.forEach(a => { attributes[a] = node.getAttribute(`data-${a}`) || undefined; });

                return `\`\`\`${node.getAttribute('data-lang') || ''}|${JSON.stringify(attributes)}\n${node.textContent}\n\`\`\``;
            }
        })
        .turndown(req.body.notebookHtml);

    res.attachment('notebookMd').send(convertedMd);
}

exports.runQuiz = function (req, res) {
    let { quiz_type, quiz_answers, selectedAnswers } = req.body;

    // decrypt quiz answers
    quiz_answers = utils.decryptWithKey(quiz_answers, req.session.id);

    let correctAnswers = quiz_answers.split(',').map(a => Number(a));

    let status = correctAnswers.every(answer => selectedAnswers.includes(answer));

    let result = { result: { status, correctAnswers, selectedAnswers } };
    // , cellindex: req.body.stepIndex, cellid: res.cell.id }

    res.status('200').json(result);
}

function maskSecrets(secretVariables, string) {
    secretVariables.forEach(secret => {
        const secretRegExp = new RegExp(secret.value, 'g');
        string = string.replace(secretRegExp, '*****');
    });
    return string;
}
