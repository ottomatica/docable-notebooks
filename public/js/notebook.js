new ClipboardJS('.copy-btn', {
    text: function (trigger) {
        return $(trigger).siblings('pre[data-docable="true"]').text();
    }
});

const runEnpoint = window.location.pathname.startsWith('/examples') ? '/runexample' : '/run';
let exampleName = undefined;
if(runEnpoint == '/runexample') exampleName = window.location.pathname.split('/')[2];

let markdownContent = md;
let IR;

if(document.getElementById("input-file"))
    document.getElementById("input-file").addEventListener('change', getFile);


setupExamplesDropdown();

function setupExamplesDropdown() {
    _fetchExamples();
    _selectExample();
}

function _selectExample() {
    $("#examples-dropdown").change(function () {
        const selectedExample = $('#examples-dropdown option').filter(':selected').val();
        fetch(`/getexamples/${selectedExample}`, {
            method: 'GET',
            mode: 'cors',
        })
        .then(response => response.text())
        .then(content => {

            markdownContent = content;
            // using /markdown endpoint to do md2html
            fetch('/markdown', {
                method: 'POST',
                mode: 'cors',
                body: content,
                headers: { "content-type": "text/plain; charset=UTF-8" },
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById("main").innerHTML = data.html;
                IR = data.IR;
            });

        });
    });
}

function _fetchExamples () {
    fetch('/getexamples', {
        method: 'GET',
        mode: 'cors',
    })
    .then(response => response.json())
    .then(examples => {
        for(const example of examples) {
            $('#examples-dropdown').append(new Option(example, example));
        }
    });
}

function getFile(event) {
    const input = event.target
    if ('files' in input && input.files.length > 0) {
        readFileContent(input.files[0]).then(content => {
            markdownContent = content;
            // using /markdown endpoint to do md2html
            fetch('/markdown', {
                method: 'POST',
                mode: 'cors',
                body: content,
                headers: { "content-type": "text/plain; charset=UTF-8" },
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById("main").innerHTML = data.html;
                IR = data.IR;
            });
        }).catch(error => console.log(error))
    };
}

function readFileContent(file) {
    const reader = new FileReader()
    return new Promise((resolve, reject) => {
        reader.onload = event => resolve(event.target.result)
        reader.onerror = error => reject(error)
        reader.readAsText(file)
    });
}

let running = false;
function submitButtonSpinToggle() {
    running = !running;
    $('#submit-button').toggleClass('spinner-border spinner-border-sm');
}

$('#submit').click(function () {
    if (running) return;

    submitButtonSpinToggle();
    resetResults();

    fetch(runEnpoint, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ markdownContent, name: exampleName }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(response => response.text())
    .then(data => {
        const results = JSON.parse(data);
        for (const result of results) {
            // selecting cells using index to adding results
            let cell = $('[data-docable="true"]').eq(result.cell.index);
            let selector = cell.parent();

            setResults(selector, result.result);
        }

        submitButtonSpinToggle();
    });

});

$('main').on('click', '.play-btn', function () {
    if (running) return;
    submitButtonSpinToggle();

    let stepIndex = $('pre[data-docable="true"]').index($(this).siblings('pre[data-docable="true"]'));
    resetResults(stepIndex);

    fetch(runEnpoint, {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ markdownContent, stepIndex, name: exampleName}),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
        .then(response => response.text())
        .then(data => {
            const results = JSON.parse(data);
            for (const result of results) {
                // selecting cells using index to adding results
                let block = $('[data-docable="true"]').eq(result.cell.index);
                let cell = block.parent();

                setResults(cell, result.result);
            }

            submitButtonSpinToggle();
        });
})

function setResults(selector, result) {
    if (!result) return;

    if (result.status)
        _setPassing(selector, result);
    else
        _setFailing(selector, result);
    return result;
}

function _setPassing(cell, response) {
    cell.addClass('passing');

    let output = cell.next('.docable-cell-output');
    output.append(`<span class="docable-success">SUCCESS</span>: <br> <span>${response.stdout}</span>`);
    output.append(`<span>${response.stderr}</span> </br>`);
}

function _setFailing(cell, response) {
    cell.addClass('failing');

    let output = cell.next('.docable-cell-output');
    output.append(`<span class="docable-error">️ERROR</span>: <br> <span>${response.stderr}</span> </br>`);
    output.append(`<span>${response.stdout}</span> </br>`);
    output.append(`<span>exit code: ${response.exitCode}</span> </br>`);
}

function resetResults(index) {
    let output;

    let input = $('[data-docable="true"]')    
    if (index) input = input.eq(index);
        
    let cell = input.parent();
    cell.removeClass("failing");
    cell.removeClass("passing");

    output = cell.next('.docable-cell-output');

    output.empty();
}
