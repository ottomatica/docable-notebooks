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
