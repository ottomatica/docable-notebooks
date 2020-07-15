const fs = require('fs');
const prettier = require('prettier');
const showdown = require('showdown');
const showdownHighlight = require("showdown-highlight");
const JSON5 = require('json5');

// fs.writeFileSync('./notebook.html', `${resources}${gh_markdown_css}<div class="markdown-body">${html}</div>`, { encoding: 'utf-8' });

function md2html(mdText) {

	// import highlight.js
	const resources = `
		<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/styles/default.min.css">
		<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.1.1/highlight.min.js"></script>
		<link rel="stylesheet" href="./css/notebook.css">
		<link rel="stylesheet" href="./css/github-markdown.css">
		`;

	// extension examples: 
	// https://github.com/showdownjs/showdown/issues/485#issuecomment-357040051
	// https://guides.codechewing.com/add-custom-attributes-to-anchor-html-tag-showdown
	var executionAttributes = {
		type: 'output',
		regex: /(\{[^]+?\})\s*<\/p>\s*(<pre>\s*<code)/gi,
		replace: (match, attributes, codeTag) => {
			const attributesObj = JSON5.parse(attributes)
			let docableDataAttributes = 'data-docable="true"';

			for (const attribute of Object.keys(attributesObj)) {
				docableDataAttributes += ` data-${attribute}="${attributesObj[attribute]}"`;
			}

			const type = attributesObj.type;
			const sideAnnotation = `<div class="sideAnnotation">[${type}:]</div>`

			return sideAnnotation + codeTag.replace('><code', ` class="docable-cell docable-cell-${type}"><code ${docableDataAttributes}`);
		}
	};
	showdown.extension('executionAttributes', executionAttributes);

	showdown.setFlavor('github');

	const conv = new showdown.Converter({ extensions: [showdownHighlight, 'executionAttributes'] });
	let html = conv.makeHtml(mdText);
	html = `${resources}<div class="markdown-body">${html}</div>`;

	return prettier.format(html, {parser: 'html'});
}

module.exports = md2html;
