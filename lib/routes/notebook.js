const path = require('path');
const cheerio = require('cheerio');

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

exports.editCell = async function(req, res) {

    let ir = await docable.transformers.inline.transform(Buffer.from(req.body.text, 'utf-8'));
    const $ = cheerio.load(ir);
    const elem = $('[data-docable="true"]');
    let newCell = notebookRender.renderCell(elem, $, policy.isExecutable(elem, req.session.notebooks.setup));

    res.send($.html());
};

exports.runCell = async function(req, res) {
    // updating session variables
    req.session.variables = utils.updateSessionVariables(req.session.variables || [], req.body.pageVariables)

    run(req.body.text, req.body.stepIndex, req.session, res);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function run(text, stepIndex, session, res)
{
    const $$ = cheerio.load(text);

    let html = "";
    $$('[data-docable=true]').each( function(index, element)
    {
        if( policy.isExecutable($$(element), session.notebooks.setup ) )
        {
           html+= $$(element).parent().html();
        }
    });

    const $ = cheerio.load(html);

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
        const variables = [...utils.getVariables(), ...session.variables];
        const secretVariables = variables.filter(v => v.isSecret);
        let DecryptedVariables = {};
        for(const variable of variables) {
            DecryptedVariables[variable.slug] = variable.value;
        }

        docable.fromHtml($, session.notebooks.setup, session.notebooks.cwd, session.notebooks.docDir, onProgress, DecryptedVariables)
        .catch((err) => {
            if( err.message && err.message.includes('variable is not provided')){
                res.status(400);
                res.send(err.message);
            }
            else{
                res.status(400);
                res.send(err);
            }
        })
        .then(function(data)
        {
            if( data === undefined )
            {
                res.status(400);
                res.send("Execution failed.");
            }
            let {results, _, status} = data;
            results = results.map(res => {
                let index = stepIndex || res.cell.index;

                // masking secrets in output
                secretVariables.forEach(secret => {
                    const secretRegExp = new RegExp(secret.value, 'g');
                    res.result.stdout = res.result.stdout.replace(secretRegExp, '*****');
                    res.result.stderr = res.result.stderr.replace(secretRegExp, '*****');
                });

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

