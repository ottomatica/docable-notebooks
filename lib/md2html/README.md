# md2html

Convert markdown containing docable annotations to html with notebook style:


    This is a js block which is a docable file cell...
    {type: "file", path: '/tmp/foo.js', user: 'root'}
    ```js
    const p = require('path');
    ```

    and a command cell:

    {type: 'command', user: 'root'}
    ```bash
    ls | rm -rf
    ```

The output html:
![image](https://user-images.githubusercontent.com/9158546/85904420-af4a7c00-b7d6-11ea-92d6-9e17cec0b6ff.png)

## Usage

```js
const md2html = require('./lib/md2html');
const html = md2html(MD_STRING_HERE);
```

_Note: Make sure to import highlight.js, [github markdown css](./github-markdown.css), and [notebook.css](./notebook.css) in your html afterwards:_

```html
    <!-- md2html -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/styles/default.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/highlight.min.js"></script>
    <script charset="UTF-8" src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/10.0.0/languages/go.min.js"></script>
    <link rel="stylesheet" href="/css/notebook.css">
    <link rel="stylesheet" href="/css/github-markdown.css">
    <!-- md2html -->
```