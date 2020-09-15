[Setup](Setup.md#setup) | [Shells](Shells.md#shells) |  [Git](Git.md#git) | [Markdown and IDEs](MarkdownEditors.md#markdown) |  [Virtual Environments](Environments.md#environments) | [Task Management](OnlineTools.md#online-tools)

# Setup

To successfully build software, you need a properly configured environment with a variety of tools. To help us get started, we will we install some tools, package managers, that make it a little easier to configure systems. 

Whether you're a Mac, Windows, or Linux user---you should be able to find a way to be productive with the tools from this workshop. However, there may be specific tweaks, issues, and accomodatations you may have to make based on your platform.

## opunit

[opunit](https://github.com/ottomatica/opunit) is a simple tool for checking a machine, including your laptop and or any virtual machines you may have created. By running `opunit`, you'll be able to verify your machine is correctly setup for a course, workshop, or homework assignment. 

In the simpliest case, opunit can check if you have the right versions of software installed. Beyond these simple checks, opunit can also verify the correct configuration of software and services that you'll be automating later in the course.

### Installing opunit

opunit requires [node.js](https://nodejs.org/en/) to be installed.

You can then install using npm:

```bash|{type:'command'}
npm install ottomatica/opunit -g
```

### Checking your local machine

You can check your local machine against a course profile, by running the following command:

```bash|{type:'command', tty:true}
opunit profile CSC-DevOps/profile:basics.yml
```

Your resulting output might look something like this image below. The green check ✔️ indicates that a check was passed, while the red x ❌ indicates that a check failed.

![profile](resources/imgs/profile.png)

For example, the first check will validate whether the version of node.js satisties the semver requirement of being at least `^10.x.x` or greater. Notice that one of the checks under "Editor Support", fails to validate. This check looks for syntax highlighting being enabled for vim. This check fails because the .vimrc file is not presence on system.

We will be going through a series of steps to help get our local environment into shape and pass these fixes.

### An installation philosophy

> *Avoid manual installation, automate with package managers!*

When possible, using a package manager can allow you to automate and streamline the installation of tools. Instead of hunting down the right website, finding the right version and dowload link, then clicking through an installation wizard---you let the package manager take care of all those manual steps for you! 

*Tip*: Later on, the ability to automate the installation of software environments becomes important in later stages of software development, such as continuous integration, or deployment.

We will learn how to use package managers to help use manage our system.

[Next: Package Managers](setup/package-managers.md)

