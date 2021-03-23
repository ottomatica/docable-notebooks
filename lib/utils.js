const md5 = require('md5');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const slash = require('slash')
const got = require('got');
const Connectors = require('infra.connectors');
const notebookSlug = require('./notebook/slug');

const env = require('./env');
let { logger, config, secretsPass } = env.vars();

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

/**
 * 
 * @param {String} notebookDir 
 * @param {String} endpoint 
 * @param {String} extension specify if need only a specific extension, or set to undefine for all
 * @returns 
 */
async function getNotebookTree(notebookDir, endpoint, extension) {

    try {
        await fs.promises.access(notebookDir, fs.constants.F_OK);

        let roots = [];
        for await (const item of tree(notebookDir, notebookDir, endpoint, extension)) {
            roots.push(item);
        }
        return roots;
    }
    catch (err) {
        return [];
    }
}

async function* walk(dir) {
    for await (const d of await fs.promises.opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) yield* await walk(entry);
        else if (d.isFile()) yield entry;
    }
}

async function* tree(notebookDir, dir, endpoint = 'notebooks', extension) {
    for await (const d of await fs.promises.opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory() && d.name != "node_modules" && d.name != ".git") {
                      
            let children = [];
            for await( const child of await tree(notebookDir, entry, endpoint, extension) )
            {
                if (extension) {
                    if (child.folder || child.key.endsWith(`.${extension}`))
                        children.push(child);
                }
                else {
                    children.push(child);
                }
            }

            if( children.length > 0 )
            {
                yield {title: d.name, folder: true, children: children, key: entry };
            }
        }
        else if (d.isFile()) {

            if( d.name.endsWith(".md")  ) {
                // If notebookDir is missing at end `/` append.
                if (! (notebookDir.endsWith('\\') || notebookDir.endsWith('/') )) 
                    notebookDir = notebookDir + path.sep;

                // Normalize paths like  ../../
                let normalizeNotebookDir = path.normalize(notebookDir.replace(/[/]/g, path.sep));
                let link = slash(`${endpoint}/${entry.replace(normalizeNotebookDir, '')}`);

                console.log( link );

                yield {title: `<a href="${link}">${d.name}</a>`, key: entry, data: {href: link}};
            }
            else if (!extension) {
                yield { title: d.name };
            }
        }
    }
}

const simpleGit = require('simple-git');
async function githubImport(importDir, repoUrl, credentials = { username: undefined, password: undefined }) {

    if( !fs.existsSync(importDir) )
    {
        await fs.promises.mkdir(importDir);
    }

    let fnGetOwner = (url) => {
        let ownerPart = path.dirname(url);
        return ownerPart.substring(ownerPart.lastIndexOf("/")+1);
    }

    let repoName = path.basename(repoUrl);
    let repoOwner = fnGetOwner(repoUrl);

    console.log( `Processing ${repoOwner}/${repoName}`);

    let localOwnerDir = path.join(importDir, repoOwner);
    let localRepoDir = path.join(localOwnerDir, repoName);

    if(credentials.username && credentials.password)
        repoUrl = repoUrl.slice(0, 8) + `${credentials.username}:${credentials.password}@` + repoUrl.slice(8);

    try {
        await fs.promises.access(path.join(localRepoDir, '.git'), fs.constants.F_OK);
        console.log(`Pulling new changes to ${repoOwner}/${repoName}`);
        await simpleGit(localRepoDir).silent(true).pull(repoUrl, ['--recurse-submodules']);
    }
    catch (err) {
        try {
            console.log(`Cloning reporitory: ${repoOwner}/${repoName}`);
            await fs.promises.mkdir(localOwnerDir, { recursive: true })
            await simpleGit(localOwnerDir).silent(true).clone(repoUrl, ['--recursive']);
        } catch (err) {
            console.error(`Failed to clone repo ${err}`);
            await fs.promises.unlink(localRepoDir);
        }
    }    
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
    let variableList = config.get('variables') || [];

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
        
            // allow `variable => secret` but not `secret => variable`
            if (v.slug == slug) {
                if(!v.isSecret && isSecret) v.isSecret = isSecret;
                return {
                    slug,
                    value: v.isSecret ? encryptWithKey(value, secretsPass) : value,
                    isSecret: v.isSecret
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



function updateSessionVariables (sessionVariables, pageVariables) {
    const updatedVariables = [...sessionVariables];

    pageVariablesSlugs = pageVariables.map(v => v.slug);
    sessionVariables = sessionVariables.filter(v => !pageVariablesSlugs.includes(v.slug));

    return [...sessionVariables, ...pageVariables];
}

function getUserFromSession(session) {
    let user;
    if( session.user ) 
    { 
        user = {email: session.user.email};
        let hash = md5(user.email.toLowerCase());
        user.gravatar = `https://www.gravatar.com/avatar/${hash}`;
    }
    return user;
}

async function githubAvatarUrl(username) {
    const user = await got(`https://api.github.com/users/${username}`,
        { responseType: 'json', resolveBodyOnly: true, throwHttpErrors: false });
    return user.avatar_url;
}



module.exports = {
    getNotebookList, getNotebookTree,
    encryptWithKey, decryptWithKey,
    githubImport,
    getVariables, setVariable, deleteVariable,
    updateSessionVariables,
    getUserFromSession, updateSessionVariables,
    githubAvatarUrl
};
