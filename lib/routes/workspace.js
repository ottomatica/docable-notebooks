
const env = require('../env');
const utils = require('../utils');
const docable = require('docable');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');

let {logger, notebook_dir, configPath, config} = env.vars();

exports.notebooks = async function (req, res) {

    let notebooks = await utils.getNotebook(null, notebook_dir);
    let notebooks_urls = notebooks.map( nb => `/notebooks/${nb}`)
    res.render("home", { notebooks_urls });

};

exports.get_notebook = async function (req, res) {
    const name = req.params.name;

    await _get_notebook(req, res, notebook_dir, name);
}

async function _get_notebook(req, res, notebook_dir, name) {

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
        session.notebooks.cwd = '.'; // stepper.cwd; // todo: change if repo
        session.notebooks.docDir = path.resolve(notebook_dir);

        logger.info(`Rendering notebook: ${notebook_dir}/${name}.md`);
        const { html, IR, md } = await utils.notebookRender(nb);

        res.render("notebook", { notebookHtml: html });
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

exports.get_github_imports = async function (req, res) {
    const githubImportsDir = path.join(configPath, 'github');
    const notebookPath = req.query.notebook;
    _get_notebook(req, res, path.dirname(path.join(githubImportsDir, notebookPath)), path.basename(notebookPath));
}

exports.gitImport = async function(req, res) {

    const githubImportsDir = path.join(configPath, 'github');
    try {
        await fs.promises.mkdir(githubImportsDir);
    } catch (err) { }

    const importStr = req.body.repo;

    const [repoOwner, repoName] = importStr.split('/');
    const repoURL = `https://github.com/${repoOwner}/${repoName}`;

    const notebook_dir = path.join(githubImportsDir, ...importStr.split('/').slice(0, -1));
    const notebookFileName = importStr.split('/').slice(-1)[0];

    const localOwnerDir = path.join(githubImportsDir, repoOwner);
    const localRepoDir = path.join(localOwnerDir, repoName);

    try {
        await fs.promises.access(path.join(localRepoDir, '.git'), fs.constants.F_OK);
        logger.info(`Pulling new changes to ${repoOwner}/${repoName}`);
        await simpleGit(localRepoDir).silent(true).pull(repoURL);
    }
    catch (err) {
        try {
            logger.info(`Cloning reporitory: ${repoOwner}/${repoName}`);
            await fs.promises.mkdir(localOwnerDir, { recursive: true })
            await simpleGit(path.join(githubImportsDir, repoOwner)).silent(true).clone(repoURL);
        } catch (err) {
            logger.error(`Failed to clone repo ${err}`);

            await fs.promises.unlink(localOwnerDir);

            res.status(412);
            res.send(`Failed to clone repository.`);
        }
    }

    // add imported notebook to configstore
    const githubImpors = new Set(config.get('githubImports'));
    githubImpors.add(importStr);
    config.set('githubImports', Array.from(githubImpors));

    await _get_notebook(req, res, notebook_dir, notebookFileName);
}

exports.import = async function(req, res) {
    res.render('gh_import')
}
