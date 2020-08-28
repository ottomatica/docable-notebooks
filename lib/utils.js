const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Connectors = require('infra.connectors');

const env = require('./env');
let { logger, DOCKER_IMAGE, config, configPath, targets, targetsPath, secretsPass } = env.vars();

let containerTimeoutQ = {};

function notebook2slug(name) {

    let slug = name.replace(/-/g, '--')
                   .replace(/[/]/g, '-')
                   .replace(/[\\]/g, '-')
    // console.log(name, slug);
    return slug;
}

function slug2notebook(slug) {
    let name = slug.replace(/\b-\b/g, "/")
                   .replace(/--/g, "-")

    // console.log(name, slug);
    return name;
}

async function getNotebook(slug, notebookDir) {

    let name = slug2notebook(slug);
    console.log(`get notebook ${slug}, ${name}`);

    try {
        return fs.promises.readFile(path.join(notebookDir, name ), { encoding: 'utf-8' });
    }
    catch (err) {
        console.log( err.message );
        throw new Error( 'Notebook not found' + err.message )
    }
}

// return list of available notebooks
async function getNotebookList(notebookDir) {
    let notebooks = [];
    for await (const p of walk(notebookDir)) {
        if( p.endsWith('.md') ) {
            // strip leading directory
            let name = p.replace(path.basename(notebookDir)+path.sep,"");
            console.log(name, p )
            notebooks.push( name );
        }
    }
    return notebooks;
}

async function getNotebookTree(notebookDir) {
    let roots = [];

    for await (const item of tree(notebookDir,notebookDir)) {
        roots.push( item );
    }
    return roots;
}

async function* walk(dir) {
    for await (const d of await fs.promises.opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) yield* await walk(entry);
        else if (d.isFile()) yield entry;
    }
}

async function* tree(notebookDir, dir) {
    for await (const d of await fs.promises.opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) {
                      
            let children = [];
            for await( const child of await tree(notebookDir, entry) )
            {
                if( child.folder || child.key.endsWith(".md") )
                    children.push( child );
            }

            if( children.length > 0 )
            {
                yield {title: d.name, folder: true, children: children, key: entry };
            }
        }
        else if (d.isFile()) {
            let name = entry.replace(path.basename(notebookDir)+path.sep,"");
            yield {title: `<a href="/notebooks/${notebook2slug(name)}">${d.name}</a>`, key: entry};
        }
    }
}

async function getExamples(name) {

    const examplesDir = path.join(__dirname, '../examples');

    if (name) {
        try {
            return fs.promises.readFile(path.join(examplesDir, name + '.md'), { encoding: 'utf-8' });
        }
        catch (err) {
            throw 'example not found';
        }
    }

    // return list of available exampels
    else {
        return (await fs.promises.readdir(examplesDir)).filter(name => name.endsWith('.md'));
    }
}

async function createContainer(session, containerName, timeout) {

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
        await conn.run(DOCKER_IMAGE, '/bin/sh');

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

function encryptWithKey(text, passphrase) {
    const salt = Buffer.from('5ebe2294ecd0e0f', 'hex');
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha512');
    const iv = crypto.randomBytes(16);
    const algorith = 'aes-256-ctr';

    let cipher = crypto.createCipheriv(algorith, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
}

function decryptWithKey(encrypted, passphrase) {
    const salt = Buffer.from('5ebe2294ecd0e0f', 'hex');
    const key = crypto.pbkdf2Sync(passphrase, salt, 100000, 32, 'sha512');
    let [iv, text] = encrypted.split(':');
    iv = Buffer.from(iv, 'hex');
    const algorith = 'aes-256-ctr';

    let decipher = crypto.createDecipheriv(algorith, key, iv);
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function getVariables() {
    const variables = config.get('variables') || [];
    return variables.map(v => {
        return {
            slug: v.slug,
            value: v.isSecret ? decryptWithKey(v.value, secretsPass) : v.value,
            isSecret: v.isSecret
        }
    });
}

function setVariable(slug, value, isSecret = false, force = false) {
    let variableList = config.get('variables');

    const alreadyExists = variableList.filter(v => v.slug == slug).length > 0;

    if (!alreadyExists) {
        variableList.push({
            slug: slug,
            value: isSecret ? encryptWithKey(value, secretsPass) : value,
            isSecret
        });
    }
    else if (force) {
        variableList = variableList.map(v => {
        
            // allow `variable => secret` but not `secret => variabel`
            isSecret = v.isSecret || isSecret;
            if (v.slug == slug) {
                return {
                    slug,
                    value: isSecret ? encryptWithKey(value, secretsPass) : value,
                    isSecret
                }
            }

            return v;
        });
    }

    config.set('variables', variableList);
}

function deleteVariable(slug) {
    let variableList = config.get('variables') || [];
    variableList = variableList.filter(t => t.slug != slug);

    config.set('variables', variableList);
}

function getTargets() {
    const targetList = targets.get('targets') || [];
    return targetList.map(t => {

        const targetsPath = path.join(configPath, 'targets');
        const slugPath = path.join(targetsPath, t.slug);

        return {
            slug: t.slug,
            sshKey: decryptWithKey(t.sshKey, secretsPass),
            sshKeyPath: path.join(slugPath, 'key'),
            username: t.username,
            ip: t.ip,
            port: t.port
        }
    });
}

async function addTarget(sshConfig, force = false) {
    let targetList = targets.get('targets');

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
            sshKey: encryptWithKey(sshConfig.sshKey, secretsPass),
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
                    sshKey:  editSshKey ? encryptWithKey(sshConfig.sshKey, secretsPass) : t.sshKey,
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



function deleteTarget(slug) {
    let targetList = targets.get('targets') || [];
    targetList = targetList.filter(t => t.slug != slug);

    targets.set('targets', targetList);
}

function refreshEnv(currentEnv)
{

    if( require('os').platform() === 'win32')
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

// (async () => {
//     await getExamples()
//     console.log(encryptWithKey('plain text', '123'));
//     console.log(decryptWithKey(encryptWithKey('plain text', '123'), '123'));
// })()

module.exports = {
    getExamples, getNotebook, getNotebookList, getNotebookTree,
    refreshEnv, createContainer, resetContainerTimeout,
    encryptWithKey, decryptWithKey,
    slug2notebook, notebook2slug,
    getVariables, setVariable, deleteVariable,
    getTargets, addTarget, deleteTarget
};
