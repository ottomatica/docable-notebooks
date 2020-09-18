const env = require('../env');
const utils = require('../utils');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');

const yaml = require('js-yaml');

const envManager = require('../providers/manager');
const notebookManager = require('../notebook/manager');
const notebookSlug = require('../notebook/slug');
const { setNonEnumerableProperties } = require('got/dist/source');

let {logger, notebook_dir, configPath, config, githubImportsDir} = env.vars();

const isHosted = process.env.NODE_ENV == "prod" ? true: false;

exports.get_notebook = async function (req, res) {
    const repoDir = notebook_dir;
    const repoPath = req.params[0] + '.md';
    const notebookMDPath = path.join(repoDir, repoPath);

    const slug = req.params.slug;
    const cwd = undefined;

    try {
        const notebook = await notebookManager._get_notebook(req, res, path.join('/notebooks', repoPath), slug, cwd, notebookMDPath);

        const session = req.session;
        const provider = Object.keys(session.notebooks.setup)[0];
        const name = path.basename(notebookMDPath);

        await envManager.prepareEnvironment(session, provider, isHosted, name, cwd);

        res.render('notebook', { ...notebook });
    }
    catch (err) {
        logger.warn(err);
        res.status(404);
        res.send(`Notebook ${slug} not found!`);
    }
}

exports.get_notebook_imgs = async function (req, res) {
    const repoDir = notebook_dir;
    const imgPath = req.params[0] + '.' + req.params[1]; // foo . jpg
    const absImgPath = path.join(repoDir, imgPath);

    res.sendFile(path.resolve(absImgPath));
}

exports.get_environments = async function(req, res) {

    let defaultSelection =  "local";
    let setup;
    if( req.session ) 
    {
        setup = req.session.notebooks.setup;
        defaultSelection = envManager.getConnectorSlug( setup );
    }

    let environments = envManager.getAvailableEnvironments(setup);

    res.send( {environments: environments, default: defaultSelection} );
}

const dockerStanzaTemplate = (name, image) => `

setup:
  docker:
    name: ${name}
    image: ${image}
`;

const localhostTemplate = () => `

setup:
  local: {}
`;

const sshSetupStanzaTemplate = (slug, sshKey, username, ip, port) => `

setup:
    ssh:
        slug: ${slug} 
        host: ${username}@${ip}:${port == '' ? 22 : port}
        privateKey: ${sshKey}
`;

exports.set_environment = async function(req, res) {

    let id = req.params.id;

    let setupStanza;
    if( id.match(/docker:.+/))
    {
        let image = id.match(/docker:(.+)/)[1];
        setupStanza = yaml.safeLoad(dockerStanzaTemplate('newname-uuidrandom', image)).setup;
    }
    else if( id == "local" )
    {
        setupStanza = yaml.safeLoad(localhostTemplate()).setup;
    }
    else if( id.match(/ssh:.+/))
    {
        const slug = id.replace('ssh:', '');
        const target = envManager.getTargets().filter(t => t.slug == slug)[0];

        setupStanza = yaml.safeLoad(sshSetupStanzaTemplate(slug, target.sshKeyPath, target.username, target.ip, target.port)).setup;
    }

    req.session.notebooks.setup = setupStanza;
    const provider = Object.keys(setupStanza)[0];

    console.log( JSON.stringify(req.session.notebooks.setup) );
    console.log( provider );

    // We reload page on dropdown changes, so this isn't needed.
    // await envManager.prepareEnvironment(req.session, provider, false, 'newname-uuidrandom');

    res.send( "Ok" );

}

exports.reset_environment = async function(req, res) {

    let result = await envManager.resetEnvironment(req.session);
    res.send("Ok");
};


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
    res.render('gh_import', {user: utils.getUserFromSession(req.session)});
}

exports.variables = async function(req, res) {
    // sending everything except secrets
    res.render('variables', { 
        variables: utils.getVariables().map(v => ({ ...v, value: v.isSecret ? undefined : v.value})),
        user: utils.getUserFromSession(req.session)
    });

}

exports.setVariable = async function(req, res) {

    try {
        utils.setVariable(req.body.slug, req.body.value, req.body.isSecret, req.body.edit);
        res.send('OK');
    }
    catch (err) {
        res.status(412);
        res.send(`Failed to add variables: ${req.body.slug}`);
    }
}

exports.deleteVariable = async function(req, res) {
    utils.deleteVariable(req.body.slug)

    res.send('OK');
}

exports.targets = async function (req, res) {
    // sending everything back except sshKeyPath
    res.render('targets', { 
        targets: envManager.getTargets().map(t => ({ ...t, sshKey: undefined, sshKeyPath: undefined })),
        docker_images: await envManager.getDockerImages(),
        user: utils.getUserFromSession(req.session)
    });
}

exports.addImage = async function (req, res) {
    envManager.addDockerImage(req.body.image);

    res.redirect('/targets')
}

exports.addTarget = async function (req, res) {
    envManager.addTarget({ ...req.body }, req.body.edit);

    res.redirect('/targets')
}

exports.deleteTarget = async function (req, res) {
    envManager.deleteTarget(req.body.slug);

    res.send("Ok");
}
