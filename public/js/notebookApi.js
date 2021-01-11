function getAvailableEnvironments() {
    
    return fetch('/environments', {
        method: 'GET',
        mode: 'cors',
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(response => response.json());
}

function setEnvironment(id) {
    
    return fetch(`/environments/${id}`, {
        method: 'POST',
        mode: 'cors',
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(response => response.text());
}

function resetEnvironment(id) {
    return fetch(`/environments/reset/${id}`, {
        method: 'POST',
        mode: 'cors',
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(response => response.text());
}

function executeCells(endPoint, body) {

    return fetch(endPoint, {
        method: 'POST',
        mode: 'cors',
        body: body,
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(async (response) => {
        if (!response.ok) throw Error(await response.text());
        return response.text()
    });
}

function streamOutput(body, onProgress) {
    return new Promise(function(resolve, reject) {
        fetch('/runCell', {
            method: 'POST',
            mode: 'cors',
            body: body,
            headers: { "content-type": "application/json; charset=UTF-8" },
        }).then( async response =>  {
            const reader = response.body.getReader();
                //.pipeThrough(new TextDecoderStream()).getReader();

            while(true) {
                // done is true for the last chunk
                // value is Uint8Array of the chunk bytes
                const {done, value} = await reader.read(); 

                if( value )
                {
                    const decoder = new TextDecoder();
                    onProgress(decoder.decode(value));
                    console.log(`Received ${value.length} bytes`)
                }

                if (done) {
                    resolve();
                    break;
                }
    
            }
        })
    });
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

function notebookHtml2Md(notebookHtml, blob = false) {
    return fetch(`/notebookHtml2Md`, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ notebookHtml }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
        .then(response => blob ? response.blob() : response.text());
}

function runQuizAPI(selectedAnswers, attributes) {
    return fetch(`/runQuiz`, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ ...attributes, selectedAnswers }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
        .catch((error) => {
            console.error('Error:', error);
        })
        .then(async (response) => {
            response = await response.json();
            return response;
        });
}
