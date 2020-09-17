
const path = require('path');
const fs = require('fs');

const docable = require('docable');
const notebookSlug = require('./slug');
const notebookRender = require('./render');

const utils = require('../utils');

const env = require('../env');
let {logger } = env.vars();

async function readNotebook(slug, notebookDir) {

    let name = notebookSlug.slug2notebook(slug);
    console.log(`get notebook ${slug}, ${name}`);

    try {
        return fs.promises.readFile(path.join(notebookDir, name ), { encoding: 'utf-8' });
    }
    catch (err) {
        console.log( err.message );
        throw new Error( 'Notebook not found' + err.message )
    }
}

async function _get_notebook(req, res, notebook_dir, slug, cwd) {

    console.log('notebook_dir:', notebook_dir)
    const session = req.session;
    try {

        let name = notebookSlug.slug2notebook(slug);

        logger.info(`Finding notebook: ${notebook_dir}/${name}`);
        const nb = await readNotebook(slug, notebook_dir);

        logger.info(`Setuping for notebook: ${notebook_dir}/${name}`);

        let stepper = new docable.Stepper();
        let setupStanza = (req.session.notebooks && req.session.notebooks.setup) || 
                await stepper.getSetupFromDocument(path.join(notebook_dir, name));

        if( !session.notebooks )
        {
            session.notebooks = {};                
        }

        session.notebooks.setup = setupStanza;

        session.notebooks.docDir = path.resolve(notebook_dir);

        logger.info(`Rendering notebook: ${notebook_dir}/${name}`);
        const { html, IR, md, neededVariables } = await notebookRender.notebookRender(session, path.dirname(name), nb);

        if (!req.session.notebooks) req.session.notebooks = {};
        req.session.notebooks[slug] = html;
        
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