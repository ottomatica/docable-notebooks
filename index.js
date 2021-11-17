#! /usr/bin/env node
require('dotenv').config();

const path = require("path");
const fs = require('fs');
const os = require('os');
const http = require('http');

const NOTEBOOK_HOME = path.join(os.homedir(), "docable");

const yargs = require('yargs');
const argv = yargs
.option('notebook_dir', {
    alias: 'd',
    description: 'Serve notebooks from this directory on /notebooks',
    type: 'string',
    default: '.'
})
.command('import <url>', 'import url into your home directory.', {}, async function(yargs)
{
    let url = yargs.url;
    url = url.replace("docable://", "https://");   
    console.log( `Importing ${url} into ${NOTEBOOK_HOME}`);
    const utils = require('./lib/utils');

    await utils.githubImport(NOTEBOOK_HOME, url);
    process.exit();
})
.command('$0', 'start docable notebooks server', () => { }, function (argv) {
    startServer(argv);
})
.help()
.alias('help', 'h')
.argv;

function startServer(argv) {
    const port = process.env.PORT || "3000";
    const isHosted = process.env.NODE_ENV == "prod" ? true : false;

    // Initialize configure store and logger.
    const env = require('./lib/env');
    env.setup(argv.notebook_dir);

    let { config, logger, notebook_dir, configPath } = env.vars();


    const pino = require('pino');
    const expressPino = require('express-pino-logger');
    const expressLogger = expressPino({ logger });

    const express = require("express");
    const notebook_routes = require('./lib/routes/notebook');
    const workspace_routes = require('./lib/routes/workspace');

    let hostedRoutes, sessionMiddleware, initNotebookHeartbeatWS, initNotebookWS;
    if (isHosted) {
        ({ hostedRoutes, sessionMiddleware, initNotebookHeartbeatWS, initNotebookWS} = require('./modules/hosted/routes'));
    }

    const md5 = require('md5');

    const session = require('express-session');

    const open = require("open");
    const openEditor = require("open-editor");

    const utils = require('./lib/utils');
    const notebookSlug = require('./lib/notebook/slug');

    const app = express();

    sessionMiddleware = sessionMiddleware || session({
        secret: "Shh, its a secret!",
        resave: true,
        rolling: true,
        saveUninitialized: true,
        cookie: {
            sameSite: 'lax'
        }
    });

    app.use(sessionMiddleware);

    app.use(express.text({ type: 'text/plain' }));

    // edit view:
    app.set("views", path.join(__dirname, "views"));
    app.set('view engine', 'ejs');

    app.use('/js', express.static(__dirname + '/public/js'));
    app.use('/css', express.static(__dirname + '/public/css'));
    app.use('/media', express.static(__dirname + '/public/media'));

    // Handle rewrite of slugs to file path.
    app.get('/imgs/*', function (req, res) {
        let imgFile = notebookSlug.slug2notebook(req.url.replace("/imgs/", ""));
        let fullPath = path.resolve(path.join(notebook_dir, imgFile));
        res.sendFile(fullPath);
    });

    app.use(express.urlencoded({
        extended: true
    }));

    app.use(express.json());

    app.use(expressLogger);

    const server = http.Server(app);

    // init repl submodule if present
    if (fs.existsSync(path.join(__dirname, './modules/repl/.git'))) {
        console.log('Init submodule: repl');

        const Repl = require('./modules/repl');
        app.use('/modules/repl/js', express.static(__dirname + '/modules/repl/public/js'));

        const { io } = Repl(server, sessionMiddleware);
    }

    if (process.env.NODE_ENV == 'dev' || process.env.NODE_ENV == undefined) {
        logger.info(`Enabling arbitrary md in /notebooks`);

        app.get('/', async function (req, res) {
            let github_imports = config.get('githubImports');
            let notebook_tree = await utils.getNotebookTree(notebook_dir, '/notebooks', 'md');

            let user;
            if (req.session.user) {
                user = { email: req.session.user.email };
                let hash = md5(user.email.toLowerCase());
                user.gravatar = await utils.githubAvatarUrl(req.session.user.username) || `https://www.gravatar.com/avatar/${hash}`;
            }

            res.render("home", { github_imports, notebook_tree, user, isHosted });
        });

        app.post('/notebook_dir', async function (req, res) {
            let dir = "";

            if (require('os').platform() == 'darwin') {
                dir = require('child_process').execSync(`osascript -l JavaScript -e "var app = Application('Chrome');
            app.includeStandardAdditions = true;
            app.chooseFolder().toString();"`);
                dir = dir.toString().trim();
            }
            else if (require('os').platform() == 'win32') {
                const root = 'c:/'; // default c://
                const multiSelect = 0; // default 0
                const checkFileExists = 1; // default 1
                const description = "Pick folder";

                let selectFolder = require('./lib/providers/pick');
                let result = await selectFolder({ root, multiSelect, checkFileExists, description });
                if (result === 'cancelled') { console.log('Cancelled by user'); }

                else {
                    console.log(result);
                    dir = result[0];
                }
            }

            console.log(`Results ${dir}`);
            if (dir && require('fs').existsSync(dir)) {
                notebook_dir = dir;
                env.updateNotebookDir(dir);
            }
            res.redirect("/");
        });

        app.get('/variables', workspace_routes.variables);
        app.post('/setVariable', workspace_routes.setVariable);
        app.post('/deleteVariable', workspace_routes.deleteVariable);

        app.post('/run', notebook_routes.runNotebook);
        app.post('/viewCell', notebook_routes.viewCell); // #obsolete
        app.post('/editCell', notebook_routes.editCell);
        app.post('/runCell', notebook_routes.runCell);

        app.post('/environments', workspace_routes.get_environments);
        app.post('/environments/:id', workspace_routes.set_environment);
        app.post('/environments/reset/:id', workspace_routes.reset_environment);
        app.post('/environmentStatus', workspace_routes.get_target_status);

        if (notebook_dir) {
            // render notebook from notebook dir
            app.get('/notebooks/*.md', workspace_routes.get_notebook);
            app.get('/notebooks/*.(jpg|png|gif|html|css|js)', workspace_routes.get_notebook_imgs);
        }

        app.get('/import', workspace_routes.import);
        app.post('/gitImport', workspace_routes.gitImport);
        app.get('/github', workspace_routes.get_github_imports);

        app.post("/workspace/open", function (req, res) {
            let dir = req.body.dir;
            if (dir === "") {
                open(notebook_dir);
            }
            else {
                open(dir);
            }
        });

        app.post("/workspace/edit", function (req, res) {
            let dir = req.body.key;
            let dirToOpen = dir != "" ? dir : notebook_dir;

            dirToOpen = path.resolve(dirToOpen);

            console.log(dirToOpen, dir, typeof (dirToOpen));
            let results = openEditor.make([dirToOpen + ":1:1"], { editor: 'vscode' });
            console.log(results);
            require('child_process').spawn(results.binary + " " + results.arguments.join(" "), { shell: true });

            // const {defaultEditor, getEditor, allEditors} = require('env-editor');
            // console.log( getEditor('vscode') );
        });

        app.get('/targets', workspace_routes.targets);
        app.post('/addTarget', workspace_routes.addTarget);
        app.post('/addImage', workspace_routes.addImage);
        app.post('/deleteTarget', workspace_routes.deleteTarget);
    }

    app.post('/environmentStatus', workspace_routes.get_target_status);

    app.post('/notebookHtml2Md', notebook_routes.notebookHtml2Md);
    app.post('/runQuiz', notebook_routes.runQuiz);

    if (process.env.NODE_ENV == 'prod') {
        app.use('/img', express.static('./modules/hosted/public/img'));
        app.use('/media', express.static('./modules/hosted/public/media'));

        app.use('/', hostedRoutes);
        initNotebookHeartbeatWS(sessionMiddleware, server);
        initNotebookWS(sessionMiddleware, server);
    }

    app.get('*', function (req, res) {
        res.status(404).render('404');
    });

    server.listen(port, async () => {

        const envManager = require('./lib/providers/manager');
        await envManager.addDefaultImage('node:12-buster');

        logger.info(`Server started in ${process.env.NODE_ENV} NODE_ENV`);
        logger.info(`Listening to requests on http://localhost:${port}`);

        console.log(`Server started in ${process.env.NODE_ENV} NODE_ENV`);
        console.log(`Listening to requests on http://localhost:${port}`);
    });

    process.on('uncaughtException', pino.final(logger, (err, finalLogger) => {
        finalLogger.error(err, 'uncaughtException');
    }));

    process.on('unhandledRejection', pino.final(logger, (err, finalLogger) => {
        finalLogger.error(err, 'unhandledRejection');
    }));
}

