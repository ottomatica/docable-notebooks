const path = require('path');
const os   = require('os');
const fs   = require('fs');

const pino = require('pino');
let logger;

const Configstore = require('configstore');
let config, targets, dockerImages;
const configPath = path.join(os.homedir(), '.docable-notebooks');
const targetsPath = path.join(configPath, 'targets');
const processStartDate = new Date().toLocaleString("en-US");
const DocableNotebookVersion = 'v' + require('../package.json').version;

let notebook_dir;

class Env {
    constructor() {
    }

    setup(notebook_dir_arg)
    {
        if (!fs.existsSync(configPath))
            fs.mkdirSync(configPath);

        logger = pino(pino.destination({
            dest: path.join(configPath, 'docable-notebooks.log'),
            minLength: 4096,
            sync: true
        }));
        config = new Configstore('docable-notebook', {}, { configPath: path.join(configPath, 'secrets.json') });
        targets = new Configstore('docable-notebook', {}, { configPath: path.join(configPath, 'targets', 'targets.json') });
        dockerImages = new Configstore('docable-notebook', {}, { configPath: path.join(configPath, 'dockerImages', 'dockerImages.json') });

        if( !path.isAbsolute(notebook_dir_arg) )
        {
            // Only resolve relative paths
            notebook_dir = path.normalize(path.join(process.cwd(), notebook_dir_arg)) 
        }
        notebook_dir = notebook_dir_arg;
    }


    updateNotebookDir(dir)
    {
        notebook_dir = dir;
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
            dockerImages,
            githubImportsDir: path.join(configPath, 'github'),
            notebook_dir: notebook_dir,
            CONTAINER_TIMEOUT: 600000,
            secretsPass: 'ottomatica',
            processStartDate,
            DocableNotebookVersion
        }
    }
}

module.exports = new Env();