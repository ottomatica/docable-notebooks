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
            if (block.data('type') == 'file' && result.result.status) result.result.stdout == 'Created file successfully.';
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
                if (block.data('type') == 'file' && result.result.status) result.result.stdout = 'Created file successfully.';
                let cell = block.parent();

                setResults(cell, result.result);
            }

            submitButtonSpinToggle();
        });
});

$('.btn-more').on('click', function () {
    let stepIndex = $('pre[data-docable="true"]').index($(this).siblings('pre[data-docable="true"]'));
    console.log(stepIndex);

    let parent = $(this).parent();

    $(parent).hide();

    let form = 
`<form>
    <div class="form-group">
      <label for="exampleInputEmail1">Docable Cell</label>
      <textarea rows="5" class="form-control" id="exampleInputEmail1" aria-describedby="emailHelp"></textarea>
    </div>
    <button type="submit" class="btn btn-primary">Cancel</button>
    <button type="submit" class="btn btn-primary">Update</button>
  </form>
`;

    $(this).parent().parent().append(form);

    fetch('/viewCell', {
        method: 'POST',
        mode: 'cors',
        body: JSON.stringify({ markdownContent: markdownContent, stepIndex: stepIndex }),
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .catch((error) => {
        console.error('Error:', error);
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        $('#exampleInputEmail1').val(data.cell);
    });


});

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
