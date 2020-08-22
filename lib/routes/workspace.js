const os = require('os');
const env = require('../env');
const utils = require('../utils');
const docable = require('docable');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');

const yaml = require('js-yaml');

let {logger, notebook_dir, configPath, config, githubImportsDir, CONTAINER_TIMEOUT} = env.vars();

exports.notebooks = async function (req, res) {

    let notebooks = await utils.getNotebook(null, notebook_dir);
    let notebooks_urls = notebooks.map( nb => `/notebooks/${nb}`)
    res.render("home", { notebooks_urls });

};

exports.get_notebook = async function (req, res) {
    const name = req.params.name;

    await _get_notebook(req, res, notebook_dir, name);
}

exports.get_hosted_notebook = async function (req, res) {
    const name = req.params.name;

    await _get_notebook(req, res, path.resolve(__dirname, '../../examples'), name);
}

/**
 * 
 * @param {String} notebook_dir directory in which notebook exists
 * @param {String} name name of the notebook file
 * @param {String} cwd cwd path to set (optional)
 */
async function _get_notebook(req, res, notebook_dir, name, cwd) {

    const isHosted = req.originalUrl.startsWith('/examples/');
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
        const provider = Object.keys(setupStanza)[0];

        await prepareEnvironment(session, provider, isHosted, name, cwd);

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

async function prepareEnvironment(session, provider, isHosted, name, cwd)
{
    // cwd = ~ if local
    // cwd = repo_dir if git
    // cwd = . if vm/container/ssh
    if (provider == 'local') {

        // git
        if (cwd)
            session.notebooks.cwd = cwd;
        else
            session.notebooks.cwd = os.homedir();
    }

    else {
        session.notebooks.cwd = '.';

        // provider == docker
        if (provider == 'docker') {
            
            let containerName = session.notebooks.setup.docker;
            let containerTimeout;
            if(isHosted) {
                containerName = `${name}-${session.id}`;
                containerTimeout = CONTAINER_TIMEOUT;
            }

            await utils.createContainer(session, containerName, containerTimeout);
        }

    }    
}


exports.get_environments = async function(req, res) {

    let defaultSelection = "local";
    if( req.session )
    {
        let setupStanza = req.session.notebooks.setup;
        defaultSelection = Object.keys(setupStanza)[0];
    }

    res.send( {environments: ["local", "docker"], default: defaultSelection} );

}

const dockerStanzaTemplate = (name) => `

setup:
  docker: ${name}
`;

const localhostTemplate = () => `

setup:
  local: {}
`;

exports.set_environment = async function(req, res) {

    let id = req.params.id;

    let setupStanza;
    if( id == "docker")
    {
        setupStanza = yaml.safeLoad(dockerStanzaTemplate('newname-uuidrandom')).setup;
    }
    else if( id == "local" )
    {
        setupStanza = yaml.safeLoad(localhostTemplate()).setup;
    }

    req.session.notebooks.setup = setupStanza;
    const provider = Object.keys(setupStanza)[0];

    console.log( JSON.stringify(req.session.notebooks.setup) );
    console.log( provider );

    await prepareEnvironment(req.session, provider, false, 'newname-uuidrandom');

    res.send( "Ok" );

}


exports.get_github_imports = async function (req, res) {
    const notebookPath = req.query.notebook;
    const notebookDir = path.dirname(path.join(githubImportsDir, notebookPath));
    const notebookName = path.basename(notebookPath);
    const notebookRepoPath = path.join(githubImportsDir, notebookPath.split('/').slice(0, 2).join('/'));

    _get_notebook(req, res, notebookDir, notebookName, notebookRepoPath);
}

exports.gitImport = async function(req, res) {

    try {
        await fs.promises.mkdir(githubImportsDir);
    } catch (err) { }

    const importStr = req.body.repo;

    const [repoOwner, repoName] = importStr.split('/');
    const repoURL = `https://github.com/${repoOwner}/${repoName}`;

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

    // Redirect to home page after successful import.
    res.redirect('/');
}

exports.import = async function(req, res) {
    res.render('gh_import')
}
