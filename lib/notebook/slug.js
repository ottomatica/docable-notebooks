function notebook2slug(name) {

    let slug = name.replace(/-/g, '--')
                   .replace(/[/]/g, '-')
                   .replace(/[\\]/g, '-');
    return slug;
}

function slug2notebook(slug) {
    let name = slug.replace(/\b-\b/g, "/")
                   .replace(/--/g, "-");
    return name;
}

module.exports = {
    notebook2slug,
    slug2notebook
}
