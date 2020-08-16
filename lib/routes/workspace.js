
const env = require('../env');
const utils = require('../utils');
const docable = require('docable');
const path = require('path');
const fs = require('fs');

let {logger,notebook_dir} = env.vars();

exports.notebooks = async function (req, res) {

    let notebooks = await utils.getNotebook(null, notebook_dir);
    let notebooks_urls = notebooks.map( nb => `/notebooks/${nb}`)
    res.render("home", { notebooks_urls });

};

exports.get_notebook = async function (req, res) {
    const name = req.params.name;
    const session = req.session;
    try {

        logger.info(`Finding notebook: ${notebook_dir}/${name}.md`);
        const nb = await utils.getNotebook(name, notebook_dir);

        logger.info(`Setuping for notebook: ${notebook_dir}/${name}.md`);

        let stepper = new docable.Stepper();
        let setupStanza = await stepper.getSetupFromDocument(path.join(notebook_dir, name));

        if( !session.notebooks )
        {
            session.notebooks = {};                
        }

        session.notebooks.setup = setupStanza;
        session.notebooks.cwd = stepper.cwd;

        logger.info(`Rendering notebook: ${notebook_dir}/${name}.md`);
        const { html, IR, md } = await utils.notebookRender(nb);

        res.render("notebook", { notebookHtml: html, md });
    }
    catch (err) {
        logger.warn(err);
        res.status(404);
        res.send(`Notebook ${name} not found!`);
    }
}

exports.get_hosted_notebook = async function (req, res) {
    // TODO: samim
}