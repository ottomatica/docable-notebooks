
function executeCells(endPoint, body) {
    
    return fetch(endPoint, {
        method: 'POST',
        mode: 'cors',
        body: body,
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(response => response.text());
}

function editCell(text) {

    return fetch('/editCell', {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ text: text }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .catch((error) => {
        console.error('Error:', error);
    })
    .then(response => response.text());

}

function viewCell(text, stepIndex) {

    return fetch('/viewCell', {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ text: text, stepIndex: stepIndex }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .catch((error) => {
        console.error('Error:', error);
    })
    .then(response => response.json());

}