const path = require('path');
const os   = require('os');

const pino = require('pino');
let logger;

const Configstore = require('configstore');
let config, targets;
const configPath = path.join(os.homedir(), '.docable-notebooks');
const targetsPath = path.join(configPath, 'targets');

let notebook_dir;

class Env {
    constructor() {
    }

    setup(notebook_dir_arg)
    {
        logger = pino(pino.destination({
            dest: './docable-notebooks.log',
            minLength: 4096,
            sync: true
        }));
        config = new Configstore('docable-notebook', {}, { configPath: path.join(configPath, 'secrets.json') });
        targets = new Configstore('docable-notebook', {}, { configPath: path.join(configPath, 'targets', 'targets.json') });

        notebook_dir = notebook_dir_arg;
    }




    vars()
    {
        return {
            logger: logger,
            env: this,
            config,
            configPath,
            targets,
            targetsPath,
            githubImportsDir: path.join(configPath, 'github'),
            notebook_dir: notebook_dir,
            DOCKER_IMAGE: 'node:12-buster',
            CONTAINER_TIMEOUT: 600000,
            secretsPass: 'ottomatica'
        }
    }
}

module.exports = new Env();