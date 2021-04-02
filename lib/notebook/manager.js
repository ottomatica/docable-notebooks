
const path = require('path');
const fs = require('fs');

const docable = require('docable');
const notebookRender = require('./render');
const slash = require('slash');

const utils = require('../utils');

const env = require('../env');
let {logger } = env.vars();

async function readNotebook(notebookMDPath) {
    try {
        return fs.promises.readFile(notebookMDPath, { encoding: 'utf-8' });
    }
    catch (err) {
        console.log( err.message );
        throw new Error( 'Notebook not found' + err.message )
    }
}

async function _get_notebook(req, res, notebook_dir, notebookMDPath, setCurrentEnvironment) {

    const notebookUrl = `/${slash(notebook_dir)}`;
    const session = req.session;
    try {

        logger.info(`Finding notebook: ${notebookMDPath}`);
        const nb = await readNotebook(notebookMDPath);

        logger.info(`Setup for notebook: ${notebookMDPath}`);

        let stepper = new docable.Stepper();

        if (!req.session.notebooks) req.session.notebooks = {};
        if (!req.session.notebooks[notebookUrl]) req.session.notebooks[notebookUrl] = {};

        req.session.notebooks[notebookUrl].setup = await stepper.getSetupFromDocument(notebookMDPath);
        // backward compatibility
        {
            let oldSetup = req.session.notebooks[notebookUrl].setup;
            if (oldSetup.setup) {
                let setup = { targets: [] };

                let provider = Object.keys(oldSetup.setup)[0];
                setup.targets.push({
                    type: provider,
                    ...oldSetup.setup[provider]
                })

                req.session.notebooks[notebookUrl].setup = setup
            }
        }

        setCurrentEnvironment(req.session, notebookUrl);
        
        req.session.notebooks[notebookUrl].docDir = path.dirname(notebookMDPath);

        logger.info(`Rendering notebook: ${notebookMDPath}`);
        const { html, IR, md, neededVariables } = await notebookRender.notebookRender(session, notebookUrl, path.dirname(notebook_dir), nb);

        req.session.notebooks[notebookUrl].html = html;
        
        // return needed and missing variables which are used in this notebook
        const sessionVariables = (req.session.variables || [])
                                    .filter(v => neededVariables.includes(v.slug));
        const sessionVariableSlugs = sessionVariables.map(v => v.slug);

        const variables = utils.getVariables()
                                .map(v => ({ ...v, value: v.isSecret ? undefined : v.value }))
                                .filter(v => neededVariables.includes(v.slug));
        const variableSlugs = variables.map(v => v.slug);

        const missingVariables = neededVariables
                                    .filter(v => !variableSlugs.includes(v) && !sessionVariableSlugs.includes(v))
                                    .map(v => ({ slug: v }));

        return {
            notebookHtml: html,
            variables,
            sessionVariables,
            missingVariables,
        }
    }
    catch (err) {
        throw err;
    }
}

module.exports = {
    readNotebook,
    _get_notebook
}
