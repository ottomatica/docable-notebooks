const fs = require('fs');
const showdown = require('showdown');
const showdownHighlight = require("showdown-highlight");
const JSON5 = require('json5');

// fs.writeFileSync('./notebook.html', `${resources}${gh_markdown_css}<div class="markdown-body">${html}</div>`, { encoding: 'utf-8' });

function md2html(mdText) {

	// github markdown css
	const gh_markdown_css = `
		<style>
			.markdown-body {
				box-sizing: border-box;
				min-width: 200px;
				max-width: 980px;
				margin: 0 auto;
				padding: 45px;
			}

			@media (max-width: 767px) {
				.markdown-body {
					padding: 15px;
				}
			}
		</style>`;

	// import highlight.js
	const resources = `
		<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/styles/default.min.css">
		<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/highlight.min.js"></script>
		<script charset="UTF-8" src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/languages/go.min.js"></script>
		<link rel="stylesheet" href="/css/notebook.css">
		<link rel="stylesheet" href="/css/github-markdown.css">
		`;

	// extension examples: 
	// https://github.com/showdownjs/showdown/issues/485#issuecomment-357040051
	// https://guides.codechewing.com/add-custom-attributes-to-anchor-html-tag-showdown
	var executionAttributes = {
		type: 'output',
		regex: /(\{[^]+?\})\s*<\/p>\s*(<pre>\s*<code)/gi,
		replace: (match, attributes, codeTag) => {
			const attributesObj = JSON5.parse(attributes)
			let docableDataAttributes = '';

			for (const attribute of Object.keys(attributesObj)) {
				docableDataAttributes += ` data-${attribute}="${attributesObj[attribute]}"`;
			}

			const type = attributesObj.type;
			const sideAnnotation = `<div class="sideAnnotation">[${type}:]</div>`

			return sideAnnotation + codeTag.replace('><code', ` class="docable-cell docable-cell-${type}"><code${docableDataAttributes}`);
		}
	};
	showdown.extension('executionAttributes', executionAttributes);

	showdown.setFlavor('github');

	const conv = new showdown.Converter({ extensions: [showdownHighlight, 'executionAttributes'] });
	let html = conv.makeHtml(mdText);
	finalhtml = `${resources}${gh_markdown_css}<div class="markdown-body">${html}</div>`;

	console.log('result', finalhtml)
	return html;
}

module.exports = md2html;
