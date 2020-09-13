[Setup](Setup.md#setup) | [Shells](Shells.md#shells) |  [Git](Git.md#git) | [Markdown and IDEs](MarkdownEditors.md#markdown) |  [Virtual Environments](Environments.md#environments) | [Task Management](OnlineTools.md#online-tools)
# Git

![image](https://cloud.githubusercontent.com/assets/742934/15635543/d1044ff6-25ae-11e6-9680-077830cff8f5.png)

### Why Version Control?

> You're working on a team project and need to make edits to reports and code. You waiting for your team member to make a change and then email you back another a copy. There has to be a better way...

"Version control is the lab notebook of the digital world: it’s what professionals use to keep track of what they’ve done and to collaborate with other people. Every large software development project relies on it, and most programmers use it for their small jobs as well. And it isn’t just for software: books, papers, small data sets, and anything that changes over time or needs to be shared can and should be stored in a version control system." -- [Version Control with Git](http://swcarpentry.github.io/git-novice/)


## Understanding Git

What better way to understand git, then check out git itself. This might take a while...

```bash|{type:'command', stream: true, failed_when:'exitCode != 0'}
git clone https://github.com/git/git
```

We'll be working inside the git/ directory set our working state to v2.23.0.

```bash|{type:'command'}
cd git
git reset --hard v2.23.0
```

```bash|{type:'command', path: 'git'}
git log -1 --abbrev=40
```

```bash|{type:'command', path: 'git'}
git cat-file -p 5fa0
```

```bash|{type:'command', path: 'git'}
git cat-file -p 5fa0f523
```

Notice no file name.
```bash|{type:'command', path: 'git'}
git cat-file -p 5fa073a885
```

This is a tree, it has file names.
```bash|{type:'command', path: 'git', block: {top:32, left:52, width:40, height: 98, title: 'A tree can contain blobs and other trees'}}
git cat-file -p 5fa02bff4e
```

graph
```bash|{type:'command', path: 'git'}
git log --graph --oneline
```

## Practice: Creating a Repo

Let's try the basics. Let's create a new local git repository.

Create a new directory (Basics) and file (README.md).

```bash|{type:'file', path: 'Basics/README.md'}
# Project 0
Hello!
```

We are going to create a new git repository, but maybe not the way you've done it before. 
In the next set of commands, we will be working inside the `Basics/` directory.

```bash|{type:'command'}
cd Basics
git init
```

`TODO` link to Derricks' git lecture.

This will create a new .git directory to store commits and other objects.

```bash|{type:'command', path: 'Basics'}
ls -l .git
```

```bash|{type:'command', path: 'Basics'}
git add README.md
```

Our file is now being staged, but has not been committed to the repository yet.

```bash|{type:'command', path: 'Basics'}
git status
```

We will commit our staged changes into the repository.

```bash|{type:'command', path: 'Basics'}
git commit -m "initial commit"
```

While having a local git repository is cool, we should connect it to another remote repository. In other words, we have no place to `git push` to...

Perform the following steps:

1. Create a repo on GitHub (If you are a NCSU student, use GitHub Enterprise: https://github.ncsu.edu). 

2. Follow the instructions on GitHub to add a remote url to an *existing git repository*. Basically, you need to run something like: `git remote add origin https://github.com/<user>/<repo>.git`

3. Push your changes to GitHub. Verify you can see your updated README.md!

4. On GitHub, edit the README.md, to say "Hello GitHub!". Commit the changes on GitHub. Now you have changes in your remote (origin), that are missing on your local copy.

5. Run `git pull` and verify you now have the updated changes.


#### Git Branching Playground

We will solve the "Introduction Sequence" levels in:  
http://pcottle.github.io/learnGitBranching/   

![example](https://cloud.githubusercontent.com/assets/742934/9494425/c4dd4b66-4bd3-11e5-9aac-04bfc8fed771.png)

This will help you visualize the true structure of a git repository and understand how concepts such as branching are implemented.



## Git Configuration and Security

If you want to make sure your commits are properly linked to your GitHub account, make sure you have configured your computer to have your name and email filled out.

```
$ git config --global user.name "FirstName LastName"
$ git config --global user.email email@example.com
```

You might also consider an authenication strategy. If you're being asked to login everytime your pull/push to your remote repository, you might want to enable caching of your credentials. For example, you could use: 

```
git config --global credential.helper store
```

However, this may store your credentials in plain text on your computer. There are other platform-specific credential.helpers that you can use to more securely store your credentials. It is also possible to generate [personal access tokens](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/) that you can use authenicate instead of a passcode.

An alternative approach is to use sshkeys. In this case, you have a public/private keypair, with the public key stored on GitHub. You then use a [different url pattern](https://help.github.com/articles/which-remote-url-should-i-use/) for your commands such as `git clone`. Instead of the `https://` prefix, you instead use `git@github.com:user/repo.git`.

If you are interested in exploring this option: See these guides on GitHub:
  * [Generating SSH Key](https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/)
  * [Adding SSH Key to GitHub](https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/)
  * [Testing SSH Connection](https://help.github.com/articles/testing-your-ssh-connection/)

