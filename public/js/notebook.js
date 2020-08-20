const runEndpoint = window.location.pathname.startsWith('/examples') ? '/runhosted' : '/run';
let exampleName = undefined;
if(runEndpoint == '/runhosted') exampleName = window.location.pathname.split('/')[2];

let running = false;
function submitButtonSpinToggle() {
    running = !running;
    $('#submit-button').toggleClass('spinner-border spinner-border-sm');
}

$('#submit').click(function () {

    run(runEndpoint, JSON.stringify({ notebook: $('main').html(), name: exampleName }))

});

function run(endPoint, body, stepIndex)
{
    if (running) return;

    submitButtonSpinToggle();
    resetResults(stepIndex);

    // if streamable block, we're going to switch to streaming mode.
    let block = $('[data-docable="true"]').eq(stepIndex);
    if( block.length > 0 && block.data('stream') === true )
    {
        let cell = block.parent();
        let output = cell.next('.docable-cell-output');
        output.append(`<span class="docable-stream">STREAM</span>:\n`);

        let results='';
        streamOutput(body, function(data)
        {
            // Our results object is a list... quick optimization hack
            if( data.indexOf("[") == 0 || results != '')
            {
                results += data;
                // check if we've received complete string, because server might chunk up response...
                if( IsJsonString(results) )
                {
                    resetResults(stepIndex);
                    processResults(results);
                    submitButtonSpinToggle();
                }
            }
            else {
                output.append(`<span>${data}</span>\n`);
            }

        });

    }
    else {
        executeCells(endPoint, body).then(function(data) {

            processResults(data);
            submitButtonSpinToggle();
        }).catch( function(err) {
            $('#docable-error').append( err );
            submitButtonSpinToggle();
        });
        }
}

function IsJsonString(str) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

function processResults(data)
{
    const results = JSON.parse(data);
    for (const result of results) {
        // selecting cells using index to adding results
        let block = $('[data-docable="true"]').eq(result.cellindex);
        if (block.data('type') == 'file' && result.result.status) result.result.stdout = 'Created file successfully.';
        let selector = block.parent();

        setResults(selector, result.result);
    }    
}

$('main').on('click', '.play-btn', function () {

    let stepIndex = $('pre[data-docable="true"]').index($(this).siblings('pre[data-docable="true"]'));
    let cell = $('[data-docable="true"]').eq(stepIndex);

    run(runEndpoint == '/run' ? '/runCell' : '/runhosted', JSON.stringify({ text: $(cell)[0].outerHTML, stepIndex: stepIndex, name: exampleName }), stepIndex);

});

const EditForm = ({stepIndex}) =>
`<div id="update-cell-form">
    <div class="form-group">
        <label for="docable-edit-area-${stepIndex}">Edit Cell</label>
        <textarea rows="5" name="text" class="form-control" id="docable-edit-area-${stepIndex}"></textarea>
    </div>
    <button id="btn-cancel-cell" type="submit" class="btn btn-secondary">Cancel</button>
    <button id="btn-update-cell" class="btn btn-primary">Update</button>
</div>
`;

// We use the parent, with child selector because if cells are dynamically updated, then they will not be registered.
$('main').on('click', '.btn-more', function () {
    let stepIndex = $('pre[data-docable="true"]').index($(this).siblings('pre[data-docable="true"]'));
    let cell = $('[data-docable="true"]').eq(stepIndex);

    let cell_overlay = $(this).parent();
    $(cell_overlay).hide();

    cell_overlay.parent().append( EditForm({stepIndex}) );

    $('#btn-cancel-cell').on('click', function () {
        $("#update-cell-form").remove();
        $(cell_overlay).show();
    });

    $('#btn-update-cell').on('click', function () {
        editCell($(`textarea[id="docable-edit-area-${stepIndex}"`).val())
        .then(data => {
            let cell = $('[data-docable="true"]').eq(stepIndex);
            cell.parent().parent().replaceWith( data );
        });
    });

    viewCell($(cell)[0].outerHTML, stepIndex)
    .then(data => {
        console.log(data);
        $(`#docable-edit-area-${stepIndex}`).val(data.cell);
    });
});

new ClipboardJS('.copy-btn', {
    text: function (trigger) {
        return $(trigger).siblings('pre[data-docable="true"]').text();
    }
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
    output.append(`<span class="docable-success">SUCCESS</span>:\n<span>${response.stdout}</span>`);
    output.append(`<span>${response.stderr}</span>\n`);
}

function _setFailing(cell, response) {
    cell.addClass('failing');

    let output = cell.next('.docable-cell-output');
    output.append(`<span class="docable-error">️ERROR</span>:\n<span>${response.stderr}</span>\n`);
    output.append(`<span>${response.stdout}</span>\n`);
    output.append(`<span>exit code: ${response.exitCode}</span>\n`);
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
