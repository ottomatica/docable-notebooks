
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

async function _get_notebook(req, res, notebook_dir, notebookMDPath) {
    const session = req.session;
    try {

        logger.info(`Finding notebook: ${notebookMDPath}`);
        const nb = await readNotebook(notebookMDPath);

        logger.info(`Setup for notebook: ${notebookMDPath}`);

        let stepper = new docable.Stepper();
        let setupStanza = (req.session.notebooks && req.session.notebooks.setup) || 
                            await stepper.getSetupFromDocument(notebookMDPath);

        if( !session.notebooks )
        {
            session.notebooks = {};
        }

        session.notebooks.setup = setupStanza;

        session.notebooks.docDir = path.dirname(notebookMDPath);

        logger.info(`Rendering notebook: ${notebookMDPath}`);
        const { html, IR, md, neededVariables } = await notebookRender.notebookRender(session, path.dirname(notebook_dir), nb);

        if (!req.session.notebooks) req.session.notebooks = {};
        req.session.notebooks[`/${slash(notebook_dir)}`] = html;
        
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