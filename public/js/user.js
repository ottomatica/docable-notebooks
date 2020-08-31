function register(id) {
    
    return fetch(`/environments/${id}`, {
        method: 'POST',
        mode: 'cors',
        headers: { "content-type": "application/json; charset=UTF-8" },
    })
    .then(response => response.text());
}