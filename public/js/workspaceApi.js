function openDir(dir) {
    
    return fetch(`/workspace/open`, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ dir: dir }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(response => response.text());
}

function openEditor(dirOrFile) {
    
    return fetch(`/workspace/edit`, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ key: dirOrFile }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(response => response.text());
}