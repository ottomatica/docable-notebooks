const fs = require('fs');
const showdown = require('showdown');
showdown.setFlavor('github');
const md2html = require('../../lib/md2html');

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
	<link rel="stylesheet" href="../../lib/md2html/notebook.css">
	<link rel="stylesheet" href="../../lib/md2html/github-markdown.css">
	`;


const text = fs.readFileSync('./notebook.md', { encoding: 'utf-8' }).toString();
let html = md2html(text);
html = `${resources}${gh_markdown_css}<div class="markdown-body">${html}</div>`;

fs.writeFileSync('./notebook.html', html, { encoding: 'utf-8' });


// =================
// convert back to md:
// =================
// const jsdom = require('jsdom');
// const dom = new jsdom.JSDOM();
// console.log(conv.makeMarkdown(html, dom.window.document))


// =================
// lang extension:
// =================
// showdown.extension('executionAttributes', function () {
//     let matches = [];
//     return [{
//         type: 'lang',
//         regex: /(\{[^]+?\})\s*```[^]+?```/gi,
//         replace: function (s, match) {
//             console.log('natch', match);
//             console.log('s', s);
//             console.log(s.match((/<code.+?>/)));
//             matches.push(match);
//             var n = matches.length - 1;
//             return '%PLACEHOLDER' + n + '%';
//             // return s.replace(match, '');
//             // return '%PLACEHOLDER' + n + '%';
//             // return match.replace(/\s+\|\s+/);
//         }
//     },
//     {
//         type: 'output',
//         filter: function (text, converter, options) {
//             // console.log('text', text)
//             // console.log('conv', converter)
//             // console.log('opts', options)
//             // console.log('matches', attributes);
//             // console.log('json', JSON.parse(attributes));
//             // console.log(text.search(/code.+?>/))
//             // for(const attribute of attributes.slice(1,-1).split(';')) {
//             //     // console.log(attribute);
//             // }
//             // //reset array
//             // attributes = [];
//             // return text;
//             console.log('text ===> ', text)
//             console.log('matches ===> ', matches)
//             for (var i=0; i< matches.length; ++i) {
//                 var pat = '<p>%PLACEHOLDER' + i + '% *<\/p>';
//                 text = text.replace(new RegExp(pat, 'gi'), matches[i]);
//             }
//             //reset array
//             matches = [];
//             return text;
//         }
//     }] 
// });
