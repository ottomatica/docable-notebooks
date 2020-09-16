[Setup](Setup.md#setup) | [Shells](Shells.md#shells) |  [Git](Git.md#git) | [Markdown and IDEs](MarkdownEditors.md#markdown) |  [Virtual Environments](Environments.md#environments) | [Task Management](OnlineTools.md#online-tools)

# Markdown

*Markdown*, is a plain text format that can be used to express stylized text. Often other programs or tools will render markdown as html (or even pdf). It is also commonly used in platforms, such as Github, to format issues, and homepages for repositories. You can mix and match html with markdown, but there are limits, as tags such as `<script></script>` are often stripped.

How about an example. The following markdown syntax, would appear as follows:

```markdown
##### Example Header (like <h5>Header</h5>)

Paragraphs are separated by a blank line.  A hard break can be created by adding two spaces after a sentance.

2nd paragraph. *Italic*, **bold**, and `monospace` (inline code). 
```

➡️ Renders as: ➡️ 

##### Example Header (like \<h5\>Header\</h5\>)

Paragraphs are separated by a blank line.  A hard break can be created by adding two spaces after a sentance.

2nd paragraph. *Italic*, **bold**, and `monospace` (inline code). 

## Lists, Blockquotes, Hrefs, and Images

You can do more advanced things, such as creating lists.

```markdown
Itemized lists look like:

  * this one
  * that one
  * the other one

> Block quotes are
> written like so.

Hrefs have an anchor in brackets [] and (link in parens): See [Markdown format](https://daringfireball.net/projects/markdown/)

Embedded Image: ![img](https://http.cat/100)
```

➡️ Renders as: ➡️

Itemized lists look like:

  * this one
  * that one
  * the other one

> Block quotes are
> written like so.

Hrefs have an anchor in brackets [] and (link in parens): [Markdown format](https://daringfireball.net/projects/markdown/)

Embedded Image: ![img](https://http.cat/100)

## Code

```
Code (`inline code`):

    print “Code is just indented four spaces”;
```

➡️ Renders as: ➡️

Code (`inline code`):

    print “Code is just indented four spaces”;


You can also create code using "code fences".

    ```python
    n = 50 # We want to find prime numbers between 2 and 50

    print sorted(set(range(2,n+1)).difference(set((p * f) for p in range(2,int(n**0.5) + 2) for f in range(2,(n/p)+1))))
    ```

➡️ Renders as: ➡️

```python
n = 50 # We want to find prime numbers between 2 and 50

print sorted(set(range(2,n+1)).difference(set((p * f) for p in range(2,int(n**0.5) + 2) for f in range(2,(n/p)+1))))
```


## Tables

There are many different "flavors" of markdown. [Github-flavored markdown](https://help.github.com/articles/organizing-information-with-tables/) supports "tables". Which can be nice to report data results:

```
| Parameters     | 5% tfidf scores - 34 nodes | 10 % tfidf score - 34 nodes | original result for 2 GB - 34 nodes |
| ------------- |:-------------:|:-------------:|:-------------:|
| Vocabsize | 19529 | 39172 | 262144 |
| Total Token size for training | 256469820 | 238648536 | 211167796 |
| Total documents size for training | 209313401 | 209313401 | 7706477 |
| Total Time | 17 min | 24 min | 33 min |
| Total used memory     | 3.5 GB | 4.5 GB | 3.1 GB |
| Memory usage per node | 100 MB | 250 MB | 100 MB |
| Input per node | 5 GB | 6 GB | 3GB |
```
| Parameters     | 5% tfidf scores - 34 nodes | 10 % tfidf score - 34 nodes | original result for 2 GB - 34 nodes |
| ------------- |:-------------:|:-------------:|:-------------:|
| Vocabsize | 19529 | 39172 | 262144 |
| Total Token size for training | 256469820 | 238648536 | 211167796 |
| Total documents size for training | 209313401 | 209313401 | 7706477 |
| Total Time | 17 min | 24 min | 33 min |
| Total used memory     | 3.5 GB | 4.5 GB | 3.1 GB |
| Memory usage per node | 100 MB | 250 MB | 100 MB |
| Input per node | 5 GB | 6 GB | 3GB |

## Markdown editors

* Online: Github's built in editors are great for simple Markdown editing!
* Online: Also see: http://dillinger.io/
* Mac: [MacDown](http://macdown.uranusjr.com/)
* IPad: [ByWord](https://itunes.apple.com/us/app/byword/id482063361?mt=8)
* Windows: [MarkdownPad 2](http://markdownpad.com/download.html)  
  If you have trouble seeing a html preview, you may need to install the [Awesomium SDK](http://markdownpad.com/download/awesomium_v1.6.6_sdk_win.exe). More details [here](http://markdownpad.com/faq.html#livepreview-directx). Restart Markdown Pad 2 after install.



### Integrated development environments (IDEs)

> *If you're still opening and editing files in Notepad.exe, let's show you a better way!*

IDEs are an important part of a professional programming environment. You can perform many tasks such as editing, refactoring, compiling, testing, and debugging. IDEs also usually support an extensive set of plugins that help you integrate with other tools, such as maven, or performing style checking of your code.

#### Lightweight IDEs/editors

While traditional IDEs such as Visual Studio or Eclipse are industry standards, that's not the only option out there!

If you need to quickly edit code scripts, html, or markdown, features such as syntax highlighting, autocomplete, and advanced find and replace tools are essential! However, _you may not want to fire up Eclipse to change just one character_. Here are some alternative IDEs to consider.

![image](https://cloud.githubusercontent.com/assets/742934/15635554/4360c340-25af-11e6-9d9c-c6ffe4b6b5be.png)

* [Code](https://code.visualstudio.com/)
* [Atom](https://atom.io/)
* Level up vim: Put some of these stuff in [your vimrc](https://github.com/thoughtbot/dotfiles/blob/master/vimrc).
* ... Missing something? Send a pull request.

**Exercise**: Install VSCode!

```bash|{type:'command', privileged: true, platform: 'win32'}
choco install vscode -y
```

```bash|{type:'command', platform: 'darwin'}
brew install visual-studio-code
```

## Practice: Create an About Me Page

Update your README.md in 'Basics/' in your favorite editor. Using your new markdown skills, include the following details:

* Something about you.
* Where you are from.
* A picture.
* A list of skills
* If brave, a table and a favorite code snippet.

Commit and push the code to your remote repository.

## Advanced: Creating a WebPage using GitHub Pages

You can use GitHub Pages to host static (generated) web content. A typical pattern is to keep your source materials (markdown/templates) on your master branch, while keeping your generated content (html/js/css) on a `gh-pages` branch. 

Let's practice creating a hosted version of your site. Bonus: It is also great practice of your git knowledge.

### Pandoc

First, let's download a simple tool that can help us translate markdown => html. Using a package manager, download `pandoc`. e.g. for Windows, `choco install pandoc`.

Test out using pandoc on your README.md

```
pandoc README.md
```

You should see html output on the console. Before we try keeping this content, let's prepare our gh-pages branch.

### Creating gh-pages

You can create a new branch using `git branch gh-pages`. Do you remember which command we should use to switch branches?

Use `git switch gh-pages`. You should see that you have switched to the gh-pages branch. Confirm with `git branch`. You should see an asterisk next to gh-pages.

Using the stdout redirect operator `>`, you should be able to run `pandoc` again, but write to a new file `index.html`. Stage and commit the new file.

Let's get dangerous. *Remember*, we do not want source content in our gh-pages, so that means you can delete your README.md when you are in the gh-pages branch.

Push your changes.

### Viewing GitHub Pages

You should now be able to see your html file on GitHub!

For GitHub, your page will be available at the following url:

```
http://<user>.github.io/<repo>/index.html
```

For example, see:

* website: http://startupbot.github.io/MobileTouch/  
* gh-pages: https://github.com/StartupBot/MobileTouch/tree/gh-pages 

For GitHub Enterprise, your page will be available at the following url:

```
http://pages.github.ncsu.edu/<user>/<repo>/index.html
```