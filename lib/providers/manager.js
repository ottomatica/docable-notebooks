const path = require('path');
const fs = require('fs');
const os = require('os');

const Connectors = require('infra.connectors');

const utils = require('../utils');
const env = require('../env');
let { logger, configPath, targets, targetsPath, dockerImages, secretsPass, CONTAINER_TIMEOUT } = env.vars();

let containerTimeoutQ = {};


function getAvailableEnvironments(setup)
{
    let environments = new Set(['local', 'docker']);
    if( setup )
    {
        environments.add(Object.keys(setup)[0]);
    }

    // add ssh targets
    const sshTargets = getTargets();
    for (const target of sshTargets) {
        environments.add(`ssh:${target.slug}`);
    }

    return Array.from(environments);
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

            await createContainer(session, 'node:buster-12', containerName, containerTimeout);
        }

    }    
}

function getTargets() {
    const targetList = targets.get('targets') || [];
    return targetList.map(t => {

        const targetsPath = path.join(configPath, 'targets');
        const slugPath = path.join(targetsPath, t.slug);

        return {
            slug: t.slug,
            sshKey: utils.decryptWithKey(t.sshKey, secretsPass),
            sshKeyPath: path.join(slugPath, 'key'),
            username: t.username,
            ip: t.ip,
            port: t.port
        }
    });
}

async function addTarget(sshConfig, force = false) {
    let targetList = targets.get('targets') || [];

    const slugPath = path.join(targetsPath, sshConfig.slug);

    for(const dir of [targetsPath, slugPath]) {
        try {
            await fs.promises.access(dir, fs.constants.F_OK);
        } catch (err) {
            await fs.promises.mkdir(dir);
        }
    }

    // if already exists
    const alreadyExists = targetList.filter(t => t.slug == sshConfig.slug).length > 0;

    if (!alreadyExists) {
        targetList.push({
            slug: sshConfig.slug,
            sshKey: utils.encryptWithKey(sshConfig.sshKey, secretsPass),
            username: sshConfig.username,
            ip: sshConfig.ip,
            port: sshConfig.port
        });

        fs.promises.writeFile(path.join(slugPath, `key`), sshConfig.sshKey, { encoding: 'utf-8' });
    }

    else if (force) {

        const editSshKey = sshConfig.sshKey != '';

        targetList = targetList.map(t => {
            if (t.slug == sshConfig.slug) {
                return {
                    slug: sshConfig.slug,
                    sshKey:  editSshKey ? utils.encryptWithKey(sshConfig.sshKey, secretsPass) : t.sshKey,
                    username: sshConfig.username,
                    ip: sshConfig.ip,
                    port: sshConfig.port
                };
            }
            return t;
        });

        if(editSshKey)
            fs.promises.writeFile(path.join(slugPath, `key`), sshConfig.sshKey, { encoding: 'utf-8' });
    }
 
    targets.set('targets', Array.from(targetList));

}


async function getDockerImages()
{
    const targetList = dockerImages.get('dockerImages') || [];
    return targetList;
}

async function addDockerImage(image)
{
    const targetList = dockerImages.get('dockerImages') || [];
    targetList.push( image.image );
    dockerImages.set('dockerImages', Array.from(targetList));
}

async function createContainer(session, image, containerName, timeout) {

    const conn = Connectors.getConnector('docker', containerName);
    const containerExists = await conn.containerExists();
    const containerIsReady = await conn.ready();

    if (!containerExists || !containerIsReady) {

        if (containerExists && !containerIsReady)
            await conn.delete();

        // delete any other containers associated with this session 
        // (each session can have only 1 container at a time, to save resources)
        if (session.container) {
            const conn = Connectors.getConnector('docker', session.container);
            if (await conn.containerExists()) {
                logger.info(`Deleting session's previous container: ${session.container}`);
                await conn.delete();
            }
        }

        // create new container for this notebook + session
        logger.info(`Available memory: ${Number.parseFloat(100 * os.freemem() / os.totalmem()).toFixed(2)}%`);
        logger.info(`Creating new container: ${containerName}`);
        await conn.run(image, '/bin/sh');

        // setting current container name for session 
        session.container = containerName;

        // setting timeout
        containerTimeoutQ[containerName] = resetContainerTimeout(containerName, timeout);
    }
}

function resetContainerTimeout(name, timeout) {
    logger.info(`Cancelling container timeout if any: ${name}`);
    clearTimeout(containerTimeoutQ[name]);

    if (!timeout) return;

    logger.info(`Setting container timeout = ${timeout}ms: ${name}`);
    const conn = Connectors.getConnector('docker', name);

    containerTimeoutQ[name] = setTimeout(async () => {
        await conn.delete();
    }, timeout);

    return containerTimeoutQ[name];
}



function deleteTarget(slug) {
    let targetList = targets.get('targets') || [];
    targetList = targetList.filter(t => t.slug != slug);

    targets.set('targets', targetList);
}

function refreshEnv(currentEnv)
{

    if( os.platform() === 'win32')
    {
        let output = require('child_process').execSync("REG query HKCU\\Environment").toString();
        let lines = output.split(/\r?\n/g);
        // Remove header
        lines.splice(0, 2);
        // Clean up output and prepare output
        let variables = lines.filter( (line) => line != "" )
            .map( line => line.trim().split(/\s{4,4}/))
        ;

        console.log( lines );

        for( let entry of variables )
        {
            if( entry.length != 3 )
                continue;

            let key = entry[0];
            let kind = entry[1];
            let value = entry[2];

            // Currently support strings
            if( kind == "REG_SZ" )
            {
                console.log( key, value );
                currentEnv[key] = value;
            }
        }

    }

    return currentEnv;

};

module.exports = {
    refreshEnv, resetContainerTimeout,
    getDockerImages, addDockerImage,
    getTargets, addTarget, deleteTarget,
    prepareEnvironment, getAvailableEnvironments
};