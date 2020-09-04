# Docable

> Next-Generation Interactive Notebooks

`docable` will create an interactive notebook from a Markdown file. Docable works by translating markdown files into interactive cells, which can be run, edited, and shared.

This results in a literate programming environment for markdown files. Markdown files remain 100% compatible and render normally on GitHub, etc. If done properly, Docable can allow you to design and build interactive tutorials, interactive education and training materials, and simple infrastructure runbooks.

## Using a Docable Notebook

With docable, your markdown will be translated from this:

`figlet` will translate the given text into an ascii banner. Try it out!

```bash|{type: 'command'}
figlet docable
```

**Into this**:

![figlet-demo](docs/img/docable-figlet.gif)


### Editing Cells

Docable cells can be edited and run again.

![docable-edit](docs/img/docable-edit.png)

### Creating file content, using variables, and more.

Docable has designed after [studying over 600 online tutorials](http://chrisparnin.me/pdf/docable_FSE_20.pdf) and discovering issues that contribute to poor learner experiences. We've designed a few additional features that smooth over these issues for tutorial takers and authors.

One of the most common problem was the numerous and inconsistent ways tutorials asked someone to edit a file on a server.
Docable _file cells_ take care of creating paths, setting file permissions and owners, and filling in variable content—with a simple click.

![docable-file](docs/img/docable-file.png)

More features have been developed, which can be explored by seeing the [documentation examples](examples/).

## Creating and Viewing Notebooks

To create a notebook, you simply create a markdown file and provide a few annotations on code blocks.

~~~
```bash|{type: 'command'}
figlet docable
```
~~~

A docable file cell can be created as follows.
~~~bash
```js|{type:"file",path:'id.js'}
Math.random().toString(36).substring(2);
```
~~~

Special annotations can also be provided on commands, allowing even better experiences.

~~~bash
```bash|{type: 'command', privileged: true, platform: 'win32'}
choco install figlet-go -y
```
~~~

![privileged](docs/img/docable-privileged.png)


## Installing and Running Docable Notebooks


Simply clone this repository.
```bash|{type: 'command'}
git clone https://github.com/ottomatica/docable-notebooks/
```

Install dependencies and start server.
```bash|{type: 'command'}
npm install
npm run dev
```

Your Docable Notebooks can be interacted with at http://localhost:3000.

