[Setup](Setup.md#setup) | [Shells](Shells.md#shells) |  [Git](Git.md#git) | [Markdown and IDEs](MarkdownEditors.md#markdown) |  [Virtual Environments](Environments.md#environments) | [Task Management](OnlineTools.md#online-tools)

### Package Managers

*Package managers* are tools for installing libraries and tools, which help manage dependencies and configuration of files and environment variables. 

There are generally two flavors of package managers. *Binary* package managers typically install platform specific dependencies, whereas, *source* package managers typically install libraries you can use in your code.

* **Binary**: brew, choco, apt-get  
* **Source**: npm, pip, maven

### Installing Package Managers

If you're using Linux, you typically already have a package manager, such as `yum` or `apt-get`. You can skip this step.

##### Installing HomeBrew on Mac OS X

Homebrew is a popular package manager for MacOS. To install, open a terminal window and run the install command shown on [http://brew.sh/](http://brew.sh/).

Let's check if we have `brew` installed on the system.
```bash|{type: 'command', platform:'darwin'}
brew --version
```


Here is an example of how to install the utility `wget`.
```bash|{type: 'command', platform:'darwin'}
brew install wget
```

##### Installing Chocolatey on Windows

Chocolatey is a package manager for Windows. Once Chocolatey is installed, you can use it to install other tools on your system using `choco install <package-name>`.

We will check if we have choco installed. If not, you will be redirected to the [Chocolatey Install Notebook](setup/install-choco.md).

```bash|{type: 'command', platform:'win32', redirect: 'workshops-EngineeringBasics-setup-install--choco.md', failed_when:"!stdout.includes('XChocolatey v')"}
choco --V
```



Important, when running commands that will make changes to your system, you may need to "Run (them) as Administrator". Notice, how when we run this command, `choco` warns us that we are not running inside an elevated shell.

```bash|{type: 'command',platform:'win32'}
choco install wget -y
```

We can try again, but this time, with a shell that has administrative priliveges:

```bash|{type: 'command', privileged: true, platform:'win32'}
choco install wget -y
```

Finally, we can remove `wget` using the `remove` parameter.

```bash|{type: 'command', privileged: true, platform:'win32'}
choco uninstall wget -y --remove-dependencies
```

## Practice: Installing useful software

See if you can find the packages for these tools with your package manager and install them (if you do not already have them).

* git
* node.js
* python2

Let's check if we have `brew` installed on the system.
```bash|{type: 'command', platform:'darwin'}
brew --version
```