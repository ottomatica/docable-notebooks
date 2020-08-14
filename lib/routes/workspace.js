
const env = require('../env');
const utils = require('../utils');

let {logger,notebook_dir} = env.vars();

exports.notebooks = async function (req, res) {

    let notebooks = await utils.getNotebook(null, notebook_dir);
    let notebooks_urls = notebooks.map( nb => `/notebooks/${nb}`)
    res.render("home", { notebooks_urls });

};


exports.get_notebook = async function (req, res) {
    const name = req.params.name;
    try {
        logger.info(`Finding notebook: ${notebook_dir}/${name}.md`);
        const nb = await utils.getNotebook(name, notebook_dir);

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