const path = require('path');
const os   = require('os');

const pino = require('pino');
let logger;

const Configstore = require('configstore');
let config;

let notebook_dir;

class Env {
    constructor() {
    }

    setup(notebook_dir_arg)
    {
        logger = pino(pino.destination({
            dest: './docable-notebooks.log',
            sync: false
        }));
        config = new Configstore('docable-notebook', {}, { configPath: path.join(os.homedir(), '.docable-notebooks', 'secrets.json') });

        notebook_dir = notebook_dir_arg;
    }




    vars()
    {
        return {
            logger: logger,
            env: this,
            config: config,
            notebook_dir: notebook_dir,
            DOCKER_IMAGE: 'node:12-buster',
            CONTAINER_TIMEOUT: 600000
        }
    }
}

module.exports = new Env();