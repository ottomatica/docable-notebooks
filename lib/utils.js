const os = require('os');
const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const docable = require('docable');
const crypto = require('crypto');
const Connectors = require('infra.connectors');

const env = require('./env');
let { logger, DOCKER_IMAGE, config, configPath, secretsPass } = env.vars();

let containerTimeoutQ = {};

async function notebookRender(slug, md, ir) {

    let IR;
    let html;
    try{
        IR = ir || await docable.transformers.inline.transform(Buffer.from(md, 'utf-8'));

        const $ = cheerio.load(IR);
        $('[data-docable="true"]').each(function (index, elem) {

            let cell = renderCell($(elem), $)

        });


        // render svg blocks
        $('pre').each(function (index, elem) {

            if( $(elem).hasClass("language-svg") )
            {
                let text = $(elem).text();
                console.log(text);
                $(elem).wrap(`<div class="svg-container"></div>`);
                $(elem).parent().append(`<div class="svg-preview">${text}</div>`);
            }
        });
        // Rewrite relative imgs to be use media slug.
        let baseDir = "";
        if( slug != ".") baseDir = slug + "-";
        $('img').each(function () {
            const link = $(this).attr('src');
            if (!link.startsWith('http') && !link.startsWith('//')) {
                let fixedUrl = "/imgs/" + baseDir + notebook2slug(link);
                $(this).attr('src', fixedUrl);
            }
        });
        // Rewrite relative links to markdown items to use notebook slug
        $('a').each(function () {
            const link = $(this).attr('href');
            if (link.match(/[.]md[#]?/) && !link.startsWith('http') && !link.startsWith('//')) {
                let fixedUrl = "/notebooks/" + baseDir + notebook2slug(link);
                $(this).attr('href', fixedUrl);
            }
        });



        html = $.html();
    } catch (err) {
        console.log('err', err)
    }

    return { html, IR, md }
}

async function renderCell(elem, $)
{
    let el = $(elem);
    let cell = $(`<div class="docable-cell docable-cell-${el.data('type')}">`);
    let overlay = $(`<div class="docable-cell-overlay">`);

    // overlay is parent to pre block
    el.wrap(overlay);
    // cell is parent to overlay
    overlay.wrap(cell);

    // add buttons
    let more_btn = 
    `<button class="docable-overlay-btn-reveal btn-more">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 560 560" id="more-icon-560" aria-hidden="true" class="option-menu">
    <path d="M350 280c0 38.634-31.366 70-70 70s-70-31.366-70-70 31.366-70 70-70 70 31.366 70 70m0-210c0 38.634-31.366 70-70 70s-70-31.366-70-70 31.366-70 70-70 70 31.366 70 70m0 420c0 38.634-31.366 70-70 70s-70-31.366-70-70 31.366-70 70-70 70 31.366 70 70"></path>
    </svg>
    </button>
    `;
    overlay.append(more_btn);

    let play_btn;
    if( el.data('type') === 'file' )
    {
        play_btn = `<button class="far fa-file docable-overlay-btn play-btn"></button>`
    }
    else if (el.data('type') === 'edit') 
    {
        play_btn = `<button class="far fa-edit docable-overlay-btn play-btn"></button>`
    }
    else
    {
        play_btn = `<button class="far fa-play-circle docable-overlay-btn play-btn"></button>`
    }
    overlay.append(play_btn);

    // let copy_btn = `<button class="far fa-copy docable-overlay-btn copy-btn"></button>`;
    // overlay.append(copy_btn);

    // insert file docable-cell-file-header
    if( el.data('type') === 'file' )
    {
        $(`<div class="docable-cell-file-header">${el.data('path')}</div>`).insertBefore(overlay)
    }

    // insert sideannotation before pre block.
    $(`<div class="sideAnnotation">[${$(elem).data('type')}:]</div>`).insertBefore(overlay)

    // insert output block
    cell.append('<div class="docable-cell-output">');

    return cell;
}

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
                if( !child.folder && child.key.endsWith(".md") )
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
    if (!(await conn.containerExists())) {
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

function setVariable(slug, value, isSecret = false) {
    const variables = new Set(config.get('variables'));
    variables.add({
        slug: slug,
        value: isSecret ? encryptWithKey(value, secretsPass) : value,
        isSecret
    });
    config.set('variables', Array.from(variables));
}

function getTargets() {
    const targets = config.get('targets') || [];
    return targets.map(t => {

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

function addTarget(sshConfig) {
    const targets = new Set(config.get('targets'));

    const targetsPath = path.join(configPath, 'targets');
    const slugPath = path.join(targetsPath, sshConfig.slug);
    try {
        fs.promises.mkdir(targetsPath);
        fs.promises.mkdir(slugPath);
    } catch (err) {

    }

    fs.promises.writeFile(path.join(slugPath, `key`), sshConfig.sshKey, { encoding: 'utf-8' });

    targets.add({
        slug: sshConfig.slug,
        sshKey: encryptWithKey(sshConfig.sshKey, secretsPass),
        username: sshConfig.username,
        ip: sshConfig.ip,
        port: sshConfig.port
    });
    config.set('targets', Array.from(targets));
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
    notebookRender, renderCell,
    getExamples, getNotebook, getNotebookList, getNotebookTree,
    refreshEnv, createContainer, resetContainerTimeout,
    encryptWithKey, decryptWithKey,
    slug2notebook, notebook2slug,
    getVariables, setVariable,
    getTargets, addTarget
};
