const env = require('../env');
const utils = require('../utils');
const path = require('path');
const fs = require('fs');
const simpleGit = require('simple-git');
const slash = require('slash');

const envManager = require('../providers/manager');
const notebookManager = require('../notebook/manager');
const notebookSlug = require('../notebook/slug');

let { logger, configPath, config, githubImportsDir, processStartDate, DocableNotebookVersion } = env.vars();

const isHosted = process.env.NODE_ENV == "prod" ? true: false;

exports.get_notebook = async function (req, res) {

    let {notebook_dir} = env.vars();

    const repoDir = notebook_dir;
    const repoPath = req.params[0] + '.md';
    const notebookMDPath = path.join(repoDir, repoPath);

    const slug = req.params.slug;
    let cwd = undefined;

    try {
        const notebook = await notebookManager._get_notebook(req, res, path.join('notebooks', repoPath), notebookMDPath);

        const notebookUrl = `/${slash(path.join('notebooks', repoPath))}`;
        const targets = req.session.notebooks[notebookUrl].setup.targets;

        let currentEnvironment = req.session.notebooks[notebookUrl].currentEnvironment
        if (!currentEnvironment) {
            const availableEnvironments = envManager.getAvailableEnvironments(targets, req.session, notebookUrl);
            req.session.notebooks[notebookUrl].availableEnvironments = availableEnvironments;

            req.session.notebooks[notebookUrl].currentEnvironment = availableEnvironments[0];
            currentEnvironment = req.session.notebooks[notebookUrl].currentEnvironment;
        }

        await envManager.prepareEnvironment(req.session, notebookUrl);

        const processUptime = String(Math.round((Date.now() - processStartDate) / 60000));

        let notebook_tree = await utils.getNotebookTree(notebook_dir, '/notebooks');

        res.render('notebook', { ...notebook, notebook_tree, isHosted, breadcrumb: notebookMDPath.split('/'), processUptime, DocableNotebookVersion });
    }
    catch (err) {
        logger.warn(err);
        res.status(404);
        res.send(`Notebook ${slug} not found!`);
    }
}

exports.get_notebook_imgs = async function (req, res) {

    let {notebook_dir} = env.vars();
    const repoDir = notebook_dir;
    const imgPath = req.params[0] + '.' + req.params[1]; // foo . jpg
    const absImgPath = path.join(repoDir, imgPath);

    res.sendFile(path.resolve(absImgPath));
}

exports.get_environments = async function (req, res) {
    const notebookUrl = req.body.notebookUrl;

    let availableEnvironments = req.session.notebooks[notebookUrl].availableEnvironments;
    let currentEnvironment = req.session.notebooks[notebookUrl].currentEnvironment;

    let environments = availableEnvironments.map(env => ({ slug: envManager.getConnectorSlug(env), id: env.id }));
    // only keep unique slugs
    environments = environments.filter((v, i, a) => a.findIndex(t => (t.slug === v.slug)) === i)

    res.send({ environments, default: { slug: envManager.getConnectorSlug(currentEnvironment), id: currentEnvironment.id } });
}

exports.get_target_status = async function (req, res) {
    const notebookUrl = req.body.notebookUrl;

    if (req.session.notebooks[notebookUrl]) {
        let currentEnvironment = req.session.notebooks[notebookUrl].currentEnvironment;
        res.send(await envManager.environmentStatus(currentEnvironment));
    }
    else {
        res.status(404);
        res.send(`Notebook ${slug} not loaded!`);
    }
}

const dockerStanzaTemplate = (name, image) => `

targets:
    - type: docker
      name: ${name}
      image: ${image}
`;

const localhostTemplate = () => `

targets:
    - type: local
`;

const sshSetupStanzaTemplate = (slug, sshKey, username, ip, port) => `

targets:
    - type: ssh
      slug: ${slug} 
      host: ${username}@${ip}:${port == '' ? 22 : port}
      privateKey: ${sshKey}
`;

exports.set_environment = async function (req, res) {

    const notebookUrl = req.body.notebookUrl;
    let id = req.params.id;

    const oldEnvironment = req.session.notebooks[notebookUrl].currentEnvironment;
    const newEnvironment = req.session.notebooks[notebookUrl].availableEnvironments.find(env => env.id == id);

    if (newEnvironment) {
        await envManager.nukeEnvironment(oldEnvironment);
        req.session.notebooks[notebookUrl].currentEnvironment = newEnvironment;

        await envManager.prepareEnvironment(req.session, notebookUrl);
    }

    res.send("Ok");
}

exports.reset_environment = async function(req, res) {

    const notebookUrl = req.body.notebookUrl;

    let result = await envManager.resetEnvironment(req.session.notebooks[notebookUrl].currentEnvironment);
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
