const md5 = require('md5');
const os = require('os');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const slash = require('slash')
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

async function getNotebookTree(notebookDir, endpoint) {

    try {
        await fs.promises.access(notebookDir, fs.constants.F_OK);

        let roots = [];
        for await (const item of tree(notebookDir, notebookDir, endpoint)) {
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

async function* tree(notebookDir, dir, endpoint = 'notebooks') {
    for await (const d of await fs.promises.opendir(dir)) {
        const entry = path.join(dir, d.name);
        if (d.isDirectory()) {
                      
            let children = [];
            for await( const child of await tree(notebookDir, entry, endpoint) )
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



module.exports = {
    getNotebookList, getNotebookTree,
    encryptWithKey, decryptWithKey,
    getVariables, setVariable, deleteVariable,
    updateSessionVariables,
    getUserFromSession, updateSessionVariables, 
};
