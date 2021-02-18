const path = require('path');
const fs = require('fs');
const os = require('os');
const uuid = require('uuid');
const child_process = require('child_process');

const Connectors = require('infra.connectors');

const utils = require('../utils');
const env = require('../env');
let { logger, configPath, targets, targetsPath, dockerImages, secretsPass } = env.vars();

let containerTimeoutQ = {};

/**
 * Note: This slug is only used in environment selector dropdown
 * @param {Object} environment array of objects if multi, or object
 */
function getConnectorSlug(environment) {
    if (environment.type === 'multi') {
        return `multi: ${environment.targets.map(env => env.name).join(', ')}`;
    }
    else if (environment.type === 'multi-docker') {
        return `multi-docker: ${environment.targets.map(env => env.name).join(', ')}`;
    }
    else if (environment.type == 'docker') {
        return `docker:${environment.image}`
    }
    else if (environment.type == 'ssh') {
        return `ssh:${environment.name}`;
    }
    return environment.type;
}

/**
 *
 * @param {Array} targets Array of targets specified in setup stanza
 */
function getAvailableEnvironments(targets, session, notebookUrl) {
    let environments = [];

    // if not a multi target notebook
    if (!targets || targets.length < 2) {

        // if not already in the list
        if (!environments.some(env => env.type === targets[0].type && env.name === targets[0].name)) {
            environments.push({ ...targets[0], id: uuid.v4() });
        }

        environments.push({ type: 'local', id: uuid.v4() });

        // add docker targets
        const dockerImgs = getDockerImages();
        for (const image of dockerImgs) {
            environments.push({
                type: 'docker',
                image,
                name: `${notebookUrl.split('/').join('-').replace('-', '')}-${session.id}`,
                id: uuid.v4()
            })
        }

        // add ssh targets
        const sshTargets = getTargets();
        for (const target of sshTargets) {
            //TODO: ssh targets should be refactored to not need host property below
            environments.push({
                type: 'ssh',
                name: target.slug,
                host: `${target.username}@${target.ip}${target.port != '' ? ':' + target.port : ''}`,
                username: target.username,
                ip: target.ip,
                port: target.port,
                privateKey: target.sshKeyPath,
                id: uuid.v4()
            });
        }
    }
    else {
        // adding multi target environments
        environments.push({
            type: 'multi',
            targets: targets.map(t => ({ ...t, slug: t.name })),
            id: uuid.v4()
        });

        const allDockerTargets = targets.every(t => t.type === 'docker');
        if (!allDockerTargets) {
            // emulate similar multi target environment but using docker containers
            environments.push({
                type: 'multi-docker',
                targets: targets.map(t => ({ type: 'docker', image: 'node:12-buster', name: t.name, slug: t.name })),
                id: uuid.v4()
            })
        }
    }

    console.log('environments ==> ', JSON.stringify(environments))


    return environments;
}


/**
 * Use this to nuke old docker containers when changing to a different environment. 
 * Ignores non-docker environments 
 * 
 * @param {Object} currentEnvironment array of objects if multi, or object
 */
async function nukeEnvironment(currentEnvironment) {
    if (currentEnvironment.type.includes('multi')) {
        for (let target of currentEnvironment.targets) {
            if (target.type === 'docker') {
                const conn = Connectors.getConnector('docker', target.name);
                await conn.delete();
            }
        };
    }

    else if (currentEnvironment.type === 'docker') {
        const conn = Connectors.getConnector('docker', currentEnvironment.name);
        await conn.delete();
    }
}

async function prepareEnvironment(session, notebookUrl, containerTimeout) {
    // cwd = ~ if local
    // cwd = repo_dir if git
    // cwd = . if vm/container/ssh

    let currentEnvironment = session.notebooks[notebookUrl].currentEnvironment;

    // if a multi / multi-docker env
    if (currentEnvironment.type.includes('multi')) {
        for (let i = 0; i < currentEnvironment.targets.length; i++) {
            if (currentEnvironment.targets[i].type == 'docker') {

                try { child_process.exec(`docker network create ${session.id}`); } catch (err) { }
                try { child_process.exec(`docker network connect ${session.id} ${currentEnvironment.targets[i].name} --alias ${currentEnvironment.targets[i].slug}`, () => { }) } catch (err) { }
                try { child_process.exec(`docker network prune -f`) } catch (err) { }

                await createContainer(currentEnvironment.targets[i].image, currentEnvironment.targets[i].name, containerTimeout);
            }

            else if (currentEnvironment.targets[i].type === 'local') {
                // git
                if (currentEnvironment.targets[i].cwd)
                    currentEnvironment.targets[i].cwd = path.resolve(session.notebooks[notebookUrl].docDir, currentEnvironment.targets[i].cwd);
                else
                    currentEnvironment.targets[i].cwd = path.resolve(session.notebooks[notebookUrl].docDir);
            }

            else if (currentEnvironment.targets[i].type === 'ssh' || currentEnvironment.targets[i].type === 'bakerx') {
                currentEnvironment.targets[i].cwd = currentEnvironment.targets[i].cwd || '.';
            }
        }
    }

    else if (currentEnvironment.type === 'docker') {
        await createContainer(currentEnvironment.image, currentEnvironment.name || session.id, containerTimeout);
        currentEnvironment.cwd = currentEnvironment.cwd || '.';
    }

    else if (currentEnvironment.type === 'local') {
        // git
        if (currentEnvironment.cwd)
            currentEnvironment.cwd = path.resolve(session.notebooks[notebookUrl].docDir, currentEnvironment.cwd);
        else
            currentEnvironment.cwd = path.resolve(session.notebooks[notebookUrl].docDir);
    }

    else if (currentEnvironment.type === 'ssh' || currentEnvironment.type === 'bakerx') {
        currentEnvironment.cwd = currentEnvironment.cwd || '.';
    }

    session.notebooks[notebookUrl].currentEnvironment = currentEnvironment;
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


function getDockerImages()
{
    const targetList = dockerImages.get('dockerImages') || [];
    return targetList;
}

async function addDefaultImage(defaultImage)
{
    const conn = Connectors.getConnector('docker', '');
    const targetList = dockerImages.get('dockerImages') || [];
    if( targetList.length == 0  )
    {
        logger.info(`Adding default docker image: ${defaultImage}`);
        await addDockerImage(defaultImage);
    }
}

// ephermal data store for in-progress image pulls
let pullStatus = {};

function _getValue(v){
    let progressPoints = {
        "Waiting": 0,
        "Pulling fs layer": 0.1,
        "Downloading": 0.2,
        "Download complete": 0.7,
        "Extracting": 0.9,
        "Pull complete": 1,
        "Already exists": 1
    };
    if( progressPoints.hasOwnProperty(v) ) {
        return progressPoints[v];
    }
    return 0;
}

async function addDockerImage(image)
{
    const conn = Connectors.getConnector('docker', '');
    const targetList = dockerImages.get('dockerImages') || [];
    targetList.push( image );

    logger.info(`Pulling latest image: ${image}`);

    pullStatus[image] = {};
    pullStatus[image].ids = {};

    conn.pull( image, function(data) {

        let json = {};
        try {
            json = JSON.parse(data.toString());
        } catch(e) {
            // skip
        }
        if( json.progressDetail && json.id )
        {
            let ids = pullStatus[image].ids;
            // Update current layer with status
            ids[json.id] = json.status;

            // How many layers have made progress.
            let points = Object.values(ids)
                            .map( (id) => _getValue(id))
                            .reduce( (a,b) =>a+b,0.0);
            // Total number of layers
            let total = Object.keys(ids).length;

            pullStatus[image].points = points;
            pullStatus[image].total  = total;
            // console.log( `points: ${Math.floor(points)} out of ${total}`);
        }
    }, false).then(function(output){
        pullStatus[image].done = true;
    });

    dockerImages.set('dockerImages', Array.from(targetList));
}

// Start singleton websocket server.
let listening;
listen();
async function listen()
{
    if( listening ) return;
    listening = true;

    const io = require('socket.io')(3080);
    logger.info(`Websocket is listening on port 3080.`);

    // Force websocket protocol, otherwise some browsers may try polling.
	io.set('transports', ['websocket']);
	// Whenever a new page/client opens a dashboard, we handle the request for the new socket.
	io.on('connection', function (socket) {
        console.log(`Received connection id ${socket.id} connected ${socket.connected}`);

		if( socket.connected )
		{
			//// Broadcast heartbeat event over websockets ever 1 second
			var heartbeatTimer = setInterval( function () 
			{
                console.log("sending heartbeat", pullStatus);
				socket.emit("pullstatus", pullStatus);
			}, 1000);

			//// If a client disconnects, we will stop sending events for them.
			socket.on('disconnect', function (reason) {
				console.log(`closing connection ${reason}`);
				clearInterval(heartbeatTimer);
			});
        }
    });    
}

async function resetEnvironment(currentEnvironment) {
    if (currentEnvironment.type === 'docker') {

        let image = currentEnvironment.image;
        let name = currentEnvironment.name;

        const conn = Connectors.getConnector('docker', name);
        logger.info(`Deleting session's container: ${name}`);
        await conn.delete();
        await createContainer(image, name);
        return true;
    }
    return false;
}

async function createContainer(image, containerName, timeout) {

    const conn = Connectors.getConnector('docker', containerName);
    const containerExists = await conn.containerExists();
    const containerIsReady = await conn.ready();

    if (!containerExists || !containerIsReady) {

        if (containerExists && !containerIsReady)
            await conn.delete();

        logger.info(`Available memory: ${Number.parseFloat(100 * os.freemem() / os.totalmem()).toFixed(2)}%`);
        logger.info(`Creating new container: ${containerName}`);

        await conn.run(image, '/bin/sh', {
            // Total Bytes a container can consume before being killed.
            Memory: 262144000,
            // Units allocated to a container. 1000000000 units = 1 core.
            NanoCPUs: 500000000
        });

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
        logger.info(`[Container Timeout]. Deleting container ${name}`);
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
    let updatedEnv = require('./refresh').refresh(currentEnv)

    if( os.platform() == 'win32' )
    {
        // While the notebook server will be able to successfully spawn new programs with the latest environment
        // The external environment will not yet see any changes.
        // However, we can send the WM_SETTINGCHANGE message with the winapi.
        // We call our own program helper written in go, to perform this task
        let cmd = path.normalize( path.join( __dirname, '../../vendor/bin/send.exe'));
        console.log(`Calling ${cmd} to refresh environment`);

        let output = require('child_process').execSync(cmd).toString();
        console.log(output);
    }

    return updatedEnv;

};

module.exports = {
    refreshEnv, resetContainerTimeout, resetEnvironment,
    getDockerImages, addDockerImage, addDefaultImage,
    getTargets, addTarget, deleteTarget,
    prepareEnvironment, nukeEnvironment, getAvailableEnvironments, getConnectorSlug
};