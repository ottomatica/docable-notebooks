const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const docable = require('docable');
const crypto = require('crypto');

async function notebookRender(md, ir) {

    let IR;
    let html;
    try{
        IR = ir || await docable.transformers.inline.transform(Buffer.from(md, 'utf-8'));

        const $ = cheerio.load(IR);
        $('[data-docable="true"]').each(function (index, elem) {

            let cell = renderCell($(elem), $)

        })
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


async function getNotebook(name, notebookDir) {

    if (name) {
        try {
            return fs.promises.readFile(path.join(notebookDir, name ), { encoding: 'utf-8' });
        }
        catch (err) {
            throw 'Notebook not found';
        }
    }

    // return list of available exampels
    else {
        return (await fs.promises.readdir(notebookDir)).filter(name => name.endsWith('.md'));
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

module.exports = {notebookRender, renderCell, getExamples, getNotebook, refreshEnv};
