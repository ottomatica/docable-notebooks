const execEvent = new CustomEvent("RUNNING", {});

// Initialization
$(document).ready(function()
{
    // collapsible sidebar
    $('.sidebar-tab-btn').click(function () {
        const target = $(this).data('target');
        console.log('target', target, $(this).data('target'), $(this).attr('data-target'))
        $('.sidebar-tab-btn').css({ 'border-left': 'none', 'color': 'darkgray' });

        if ($(target).hasClass('d-none')) {
            // enable
            $('.sidebar-tab').addClass('d-none');
            $(`${target} , #sidebar-tabs`).removeClass('d-none');
            $(this).css({ 'border-left': 'solid gray', 'color': 'gray' });
        }
        else {
            $(`${target} , #sidebar-tabs`).toggleClass('d-none');
        }

        if ($('#sidebar-tabs').hasClass('d-none')) {
            $('#notebook-area').css({ 'margin-left': '0' });
        }
        else {
            $('#notebook-area').attr('style', 'margin-left: 25%!important');
        }
    });

    // warning if closing an edited page
    window.addEventListener("beforeunload", function (e) {
        if (window.isDirty) {
            e.preventDefault();
            e.returnValue = 'It looks like you have been editing the code on this page. If you leave this page, your changes will be lost.';
        }
    });

    // $('[data-toggle="tooltip"]').tooltip();
    $().tooltip({trigger: 'click hover'})

    if( !isHosted )
    {
        getAvailableEnvironments().then( function(envResponse)
        {
            for(const env of envResponse.environments) {
                $('#environment-dropdown').append(new Option(env.slug, env.id));
            }

            // select default...
            $("#environment-dropdown").val(envResponse.default.id);
        });
    }
    
    // Environment status
    {
        setTimeout(() => {
            getEnvironmentsStatus().then(targets => {
                setStatus(targets);
            });
        }, 500)

        // update target status every 5s
        setInterval(() => {
            getEnvironmentsStatus().then(targets => {
                updateStatus(targets);
            });
        }, 30000)

        const targetStatusTrue = '<i class="fas fa-check-circle text-success"></i>';
        const targetStatusFalse = '<i class="fas fa-times-circle text-danger"></i>';

        function setStatus(targets) {
            $('#target_status').html('');

            for (const target of targets) {
                $('#target_status').append(
                    `<li class="list-group-item d-flex justify-content-between align-items-center">
                        <span>
                            ${target.slug || target.type} ${target.default ? '<span class="badge badge-pill badge-info">Default</span>' : ''}
                        </span>
                        <span id="target-status-${target.name}">
                            ${target.status ? targetStatusTrue : targetStatusFalse}
                        </span>
                     </li>`
                );
            }
        }

        function updateStatus(targets) {
            for (const target of targets) {
                console.log(target.status, `#target-status-${target.name}`, target.status ? targetStatusTrue : targetStatusFalse)
                $(`#target-status-${target.name}`).html(target.status ? targetStatusTrue : targetStatusFalse);
            }
        }
    }

    // keeping track of file cell content changes
    let isDirty = {};

    $('[data-docable="true"]:not([data-type="quiz"],[data-type="file"],[data-type="script"])').focusout(function () {
        // highlight block on focusout (if != quiz != script)
        hljs.highlightBlock(this);
    })

    // making contenteditable behave more like text area
    $('pre[contenteditable]').keydown(function (e) {

        if ($(this).data('type') == 'file') {
            // content of cell is modified
            isDirty[$(this).attr('id')] = true;
        }

        // trap the return key being pressed
        if (!e.ctrlKey && e.keyCode === 13) {
            document.execCommand('insertHTML', false, '\n');
            // return false;
        }

        // TODO: should be fixed after adding editor
        if ($(this).data('type') == 'command' || $(this).data('type') == 'script') {
            if (e.ctrlKey && e.keyCode == 13) {
                $(this).siblings('.docable-overlay-btn-container').children('.play-btn').trigger('click');
                return false;
            }
        }

        // trap the tab key being pressed
        if (e.keyCode === 9) {
            document.execCommand('insertHTML', false, '\t');
            return false;
        }
    });

    $('pre[contenteditable]').on('paste', function (e) {
        var text = e.originalEvent.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        e.preventDefault();
    })

});

$("#environment-dropdown").change(function () {
    const selectedEnvironment = $('#environment-dropdown option').filter(':selected').val();

    envSpinToggle();
    setEnvironment(selectedEnvironment).then(function(response)
    {
        envSpinToggle();
        // Reload page so we can re-render cells that are platform specific.
        location.reload();
    }).catch( function(err) {
        $('#docable-error').append( err );
        envSpinToggle();
    });

});

let envSettingUp = false;
function envSpinToggle() {
    envSettingUp = !envSettingUp;
    $('#environment-spinner').toggleClass('spinner-border spinner-border-sm');
    $('#environment-menu').toggleClass('d-none');
}


let running = false;
function submitButtonSpinToggle() {
    running = !running;
    $('#submit-button').toggleClass('d-none');
    if( running == false )
    {
        $('[data-docable="true"]').removeClass('docable-cell-running');
    }
}

$('#btn-container-reset').click( function() 
{
    let id = $('#environment-dropdown').val();
    envSpinToggle();
    resetEnvironment(id).then(function(){

        envSpinToggle();
        resetResults();

    });
});

$('#submit').click(function () {

    const pageVariables = getPageVariables();

    const username = window.location.pathname.split('/')[1];
    const notebookName = window.location.pathname.split('/')[2];
    const slug = window.location.pathname.split('/')[3];

    run('/run', JSON.stringify({ notebook: $('main').html(), username, notebookPath: window.location.pathname, notebookName, pageVariables }))

});

$('#downloadNotebook').click(function () {
    const notebookHtml = $('.markdown-body').html();
    notebookHtml2Md(notebookHtml, true).then(blob => {
        const url  = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;

        a.download = `${window.location.pathname.replace('/', '').replaceAll('/', '-')}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    })
    .catch((err) => {
        $('#docable-error').empty();
        $('#docable-error').append('failed to export this notebook to a markdown file :(');
    });
})

function run(endPoint, body, stepIndex)
{
    if (running) return;

    // trigger 'running' event to auto reload playground preview
    document.dispatchEvent(execEvent);

    submitButtonSpinToggle();
    resetResults(stepIndex);

    // if streamable block, we're going to switch to streaming mode.
    let block = $('[data-docable="true"]').eq(stepIndex);

    // $('.docable-cell-output').empty();

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
                output.append(`<span>${data}</span>`);
            }

        });

    }
    else {
        executeCells(endPoint, body)
            .then(function(data) {
                processResults(data);
                submitButtonSpinToggle();
            })
            .catch( function(err) {
                $('#docable-error').append( err.message );
                submitButtonSpinToggle();
            });
    }
}

async function runQuiz(selectedAnswers, attributes, quizForm) {
    runQuizAPI(selectedAnswers, attributes, quizForm)
        .then(function (result) {
            setQuizResults(quizForm, result);
        })
        .catch(function (err) {
            $('#docable-error').append(err.message);
        });
}


function setQuizResults(cell, result) {

    _reset(cell);
    if (result.result.status)
        _setPassing(cell, result);
    else
        _setFailing(cell, result);

    function _setPassing(cell, result) {
        cell.addClass('passing');

        let output = cell.parent().next('.docable-cell-output');

        output.addClass('card bg-success p-3');
        output.append(`Correct.\n`);
    }

    function _setFailing(cell, result) {
        cell.addClass('failing');

        let output = cell.parent().next('.docable-cell-output');

        output.addClass('card bg-danger p-3');
        output.append(`Incorrect, correct answers: ${result.result.correctAnswers}`);
    }

    function _reset(cell) {
        cell.removeClass("failing");
        cell.removeClass("passing");

        let output = cell.parent().next('.docable-cell-output');
        output.empty();

        output.removeClass(['bg-danger', 'bg-success'])
        output.css('overflow', 'auto')

        // also reset docable-error box
        $('#docable-error').empty();
    }
}

function getPageVariables() {
    let pageVariables = [];
    $('.missingVariables').each(function (index, element) {

        const slug = $(element).find('input[name="slug"').val();
        const value = $(element).find('input[name="value"').val();
        if (value) {
            pageVariables.push({ slug, value });
        }
    });

    return pageVariables;
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
        // selecting cells using cellid to adding results
        let block = $(`[id="${result.cellid}"]`);
        if (block.data('type') == 'file' && result.result.status) result.result.stdout = 'Created file successfully.';
        let cell = block.parent();

        // console.log('result = ', result)

        if( result.result.status == false && $(block).data('redirect') )
        {
            window.location = $(block).data('redirect');            
        }

        setResults(cell, result.result);

        let fnInsertMarker = function(output, word, marker)
        {
            var innerHTML = output.html();
            var index = innerHTML.indexOf(word);
            if (index >= 0) { 
             innerHTML = innerHTML.substring(0,index) + 
                marker + 
                innerHTML.substring(index,index+word.length) + "</span>" + innerHTML.substring(index + word.length);

             output.html(innerHTML);
            }
        };

        // highlight 
        if ( block.data('block') )
        {
            let b = block.data('block');
            let output = cell.next('.docable-cell-output');
            let title  = b.title;

            fnInsertMarker( output, b.word, 
                `<span class='docable-block-marker'>`
            );

            let marker = $(output).find('.docable-block-marker');

            let left = marker.position().left - 3;
            let top = marker.position().top - output.position().top - 3;
            let width = marker.width()+6;
            let height = (marker.css('line-height').replace("px", "") * b.rows) + 3;

            output.before(`
            <div class="docable-cell-highlight"
                style="border: 3px solid #FF0000; position: absolute;
                background-color: rgba(131,46,35,.3);
                margin-top: ${top}px; left: ${left}px; width: ${width}px; height: ${height}px;"
                data-toggle="popover" title="ℹ️: Note" data-content="${title}"
            >
            </div>`);

            $('[data-toggle="popover"]').popover();          

        }

        if ( block.data('highlight') )
        {
            let h = block.data('highlight');
            let output = cell.next('.docable-cell-output');
            let title  = h.title;

            fnInsertMarker( output, h.word, 
                `<span class='badge badge-warning' style='font-size:100%' 
                data-toggle="popover" data-content="${title}" title="ℹ️: Note">`
            );
            $('[data-toggle="popover"]').popover();

        }

        if( block.data('chart') ) 
        {
            let chart = block.data('chart');
            let title = chart.title;
            let output = cell.next('.docable-cell-output');
            let points = output.text().trim().split('\n').splice(1);
            //let points = [1600717125, 1600717125, 1600717125];

            points = points.map( pt => moment( parseInt(pt), 'x' ));
            const groupByDay = points.reduce((acc, it) => {
                acc[it.format("YYYY-MM-DD")] = acc[it.format("YYYY-MM-DD")] + 1 || 1;
                return acc;
                }, {});

            points = Object.keys(groupByDay).map( (key) => {
                return {t: moment(key, "YYYY-MM-DD"), y: groupByDay[key] };
            });

            output.before(`
            <canvas id="myChart" width="400" height="200"></canvas>
            <script>
var ctx = document.getElementById('myChart').getContext('2d');
var myChart = new Chart(ctx, {
    type: 'line',
    data: {
        datasets: [{
            label: ['${title}'],
            data:${JSON.stringify(points)},
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            xAxes: [{
                type: 'time',
                distribution: 'series',
                time: {
                    unit: 'day'
                },
                ticks: {
                    autoSkip: true,
                    maxTicksLimit: 20,
                    beginAtZero: true   // minimum value will be 0.                    
                }            
            }]
        }
    }
});
</script>
            `);
        }
    }    
}

$('main').on('click', '.play-btn', function () {

    // run quiz cell
    if ($(this).parent().siblings('[data-type="quiz"]').length > 0) {
        const quizForm = $(this).parent().siblings('form[data-type="quiz"]');
        const selectedAnswers = [];
        quizForm.find('input').each(function (index, element) {
            if ($(element).is(':checked')) selectedAnswers.push(index);
        });

        runQuiz(selectedAnswers, { quiz_type: quizForm.data('quiz_type'), quiz_answers: String(quizForm.data('quiz_answers')) }, quizForm);
    }

    // run non-quiz cell
    else {
        const pageVariables = getPageVariables();

        let cell = $(this).parent().closest('.docable-cell');
        let block = cell.find('[data-docable="true"]');
        // let id = cell
        let stepIndex = $('pre[data-docable="true"]').index($(this).parent().siblings('pre[data-docable="true"]'));
        // let cell = $('[data-docable="true"]').eq(stepIndex);

        block.addClass( "docable-cell-running" );

        const username = window.location.pathname.split('/')[1];
        const notebookName = window.location.pathname.split('/')[2];
        const slug = window.location.pathname.split('/')[3];

        let blockhtml = '';
        if ($(this).parent().siblings('[data-type="file"],[data-type="script"]').length > 0) {
            const editorValue = window[`m_${block.attr('id').replace(/-/g, '')}`].getValue();
            blockhtml = $(block).clone().empty().text(editorValue)[0].outerHTML;
        }
        else {
            blockhtml = $(block)[0].outerHTML;
        }

        run('/runCell', JSON.stringify({ text: blockhtml, stepIndex, cellid: block.attr('id'), username, notebookPath: window.location.pathname, notebookName, pageVariables }), stepIndex);
    }
});

/////////////////// ENVIRONMENTS


////////////////// EDIT

const EditForm = ({stepIndex}) =>
`<div id="update-cell-form" class="py-2">
    <div class="form-group">
        <label for="docable-edit-area-${stepIndex}">Edit Attributes</label>
        <textarea rows="5" name="text" class="form-control" id="docable-edit-area-${stepIndex}"></textarea>
    </div>
    <button id="btn-cancel-cell" type="submit" class="btn btn-secondary">Cancel</button>
    <button id="btn-update-cell" class="btn btn-primary">Update</button>
</div>
`;

if( !isHosted )
{
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
            let attributes = JSON.parse($(`textarea[id="docable-edit-area-${stepIndex}"`).val());
            let content = "```" + attributes.lang + "|" + JSON.stringify(attributes) + "\n" + 
                            cell.text() + "\n```";

            editCell(content)
            .then(data => {
                let cell = $('[data-docable="true"]').eq(stepIndex);
                cell.parent().parent().replaceWith( data );
            });
        });

        $(`#docable-edit-area-${stepIndex}`).val(JSON.stringify(cell.data(), null, 2));
        // viewCell($(cell)[0].outerHTML, stepIndex)
        // .then(data => {
        //     console.log(data);
        //     $(`#docable-edit-area-${stepIndex}`).val(data.cell);
        //     console.log(cell.data());
        // });
    });
}

// new ClipboardJS('.copy-btn', {
//     text: function (trigger) {
//         return $(trigger).siblings('pre[data-docable="true"]').text();
//     }
// });


function setResults(selector, result) {
    if (!result) return;

    if (result.status)
        _setPassing(selector, result);
    else
        _setFailing(selector, result);
    return result;
}

function ansi2html(result)
{
    let txt = ansiparse(result).map( atom => {

        let foreground = (a) => a.foreground ? `color:${a.foreground};` : '';
        let background = (a) => a.background ? `background-color:${a.background};` : '';
        let font = (a) => {
            let css = '';
            if(a.bold ) {
                css += 'font-weight: bold;'
            }
            if( a.italic) {
                css += 'font-style: italic;'
            }
            if( a.underline ) {
                css += 'text-decoration: underline;'          
            }
            return css;
        }
        let style = `${foreground(atom)}${background(atom)}${font(atom)}`;
        if( style.length > 0 )
           return `<span style="${style}">${atom.text}</span>`;
        // return `<span>${atom.text}</span>`;
        return atom.text;
    }).join('');    
    return txt;
}

function _setPassing(cell, response) {
    cell.addClass('passing');

    let output = cell.next('.docable-cell-output');

    let stdout = ansi2html(response.stdout);
    output.append(`<span class="docable-success">SUCCESS</span>:\n${stdout}`);
    output.append(`<span>${response.stderr}</span>\n`);

    const successMessage = $(cell.find('[data-docable="true"]')[0]).data('success_message');
    if (successMessage) output.after(`<span class="success-failure-message card bg-success p-3 mb-3 unselectable">${successMessage}</span>`)

}

function _setFailing(cell, response) {
    cell.addClass('failing');

    let output = cell.next('.docable-cell-output');

    let stderr = ansi2html(response.stderr);
    let stdout = ansi2html(response.stdout);

    output.append(`<span class="docable-error">ERROR</span>:\n<span>${stderr}</span>\n`);
    output.append(`<span>${stdout}</span>\n`);
    output.append(`<span>exit code: ${response.exitCode}</span>\n`);

    const failureMessage = $(cell.find('[data-docable="true"]')[0]).data('failure_message');
    if (failureMessage) output.after(`<span class="success-failure-message card bg-danger p-3 mb-3 unselectable">${failureMessage}</span>`)
}

function resetResults(index) {
    let input = $('[data-docable="true"]')    
    if (index) input = input.eq(index);
        
    let cell = input.parent();
    cell.removeClass("failing");
    cell.removeClass("passing");

    cell.next('.docable-cell-highlight').remove();
    let output = cell.next('.docable-cell-output');
    console.log('output cell ==> ', output)
    output.empty();

    let message = output.siblings('.success-failure-message');
    message.remove();

    // also reset docable-error box
    $('#docable-error').empty();
}

function htmlDecode(input) {
    let doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

// playground js ========================================
function makeResizer (id, elIDWithoutDash) {
    const resizer = document.getElementById(id);
    const previous = resizer.previousElementSibling;
    const parent = resizer.parentElement;

    let x = 0;
    let y = 0;

    let topHeight = 0

    const mouseDownHandler = function (e) {
        x = e.clientX;
        y = e.clientY;
        topHeight = previous.getBoundingClientRect().height;

        document.addEventListener('mousemove', mouseMoveHandler)
        document.addEventListener('mouseup', mouseUpHandler);
    }

    const mouseMoveHandler = function(e) {
        const dx = e.clientX - x;
        const dy = e.clientY - y;

        const newContentHeight = topHeight + dy; 
        previous.style.height = newContentHeight + 'px';

        document.body.style.cursor = 'row-resize';

        parent.style.userSelect = 'none';
        parent.style.pointerEvents = 'none';

        if(previous.id.includes('preview')) window['html_playground_preview_height_is_dirty_' + elIDWithoutDash] = true;
    }

    const mouseUpHandler = function() {
        resizer.style.removeProperty('cursor');
        document.body.style.removeProperty('cursor');

        parent.style.removeProperty('user-select');
        parent.style.removeProperty('pointer-events');

        document.removeEventListener('mousemove', mouseMoveHandler);
        document.removeEventListener('mouseup', mouseUpHandler);
    }

    resizer.addEventListener('mousedown', mouseDownHandler);
}

function livePreviewToggle (ID) {
    if(window['livePreviewIsEnabled_'+ID]) {
        window['LivePreviewEvent_'+ID].dispose();
        window['livePreviewIsEnabled_' +ID] = false;
        if(event) event.srcElement.classList.remove('enabled');
    }
    else {
        window['LivePreviewEvent_'+ID] = window['html_playground_' + ID].onDidChangeModelContent(() => {
            window['html_playground_preview_' + ID].srcdoc = window['html_playground_' + ID].getValue();
        });
        window['html_playground_preview_' + ID].srcdoc = window['html_playground_'+ID].getValue();
        window['livePreviewIsEnabled_' + ID] = true;
        if(event) event.srcElement.classList.add('enabled');
    }
}

function livePreviewRefresh (ID) {
    window['html_playground_preview_'+ID].srcdoc = window['html_playground_' + ID].getValue();

    let e = event;
    e.srcElement.classList.add('enabled');
    setTimeout(()=>{
        e.srcElement.classList.remove('enabled');
    }, 500)
}
// playground js ======================================== 