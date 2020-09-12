[Setup](../Setup.md#setup) > Package Managers

# Package Managers

*Package managers* are tools for installing libraries and tools, which help manage dependencies and configuration of files and environment variables. 

There are generally two flavors of package managers. 

* *Binary* package managers typically install platform specific dependencies: (`brew`, `choco`, `apt-get`) 
* *Source* package managers typically install libraries you can use in your code: (`npm`, `pip`, `maven`)

## Install a Package Manager on Your System

If you're using Linux, you typically already have a package manager, such as `yum` or `apt-get`. You can skip this section.

#### Installing HomeBrew on Mac OS X

Homebrew is a popular package manager for MacOS. 

Let's check if we have `brew` installed on the system. If not, use the [Homebrew Install Instructions](install-brew.md).
```bash|{type: 'command', platform:'darwin'}
brew --version
```


Here is an example of how to install the utility `wget`.
```bash|{type: 'command', platform:'darwin'}
brew install wget
```

#### Installing Chocolatey on Windows

Chocolatey is a package manager for Windows. Once Chocolatey is installed, you can use it to install other tools on your system using `choco install <package-name>`.

We will check if we have choco installed. If not, use the [Chocolatey Install Instructions](install-choco.md).

```bash|{type: 'command', platform:'win32', failed_when:"!stdout.includes('Chocolatey v')"}
choco --V
```



Important, when running commands that will make changes to your system, you may need to "Run (them) as Administrator". Notice, how when we run this command, `choco` warns us that we are not running inside an elevated shell.

```bash|{type: 'command',platform:'win32', stream: true}
choco install wget -y
```

We can try again, but this time, with a shell that has administrative priliveges:

```bash|{type: 'command', privileged: true, platform:'win32', stream: true}
choco install wget -y
```

Finally, we can remove `wget` using the `remove` parameter.

```bash|{type: 'command', privileged: true, platform:'win32'}
choco uninstall wget -y --remove-dependencies
```

## Practice: Installing useful software

See if you can find the packages for these tools with your package manager and install them (if you do not already have them).

* `wget`, a tool for performing web requests.
* `nc`, a general networking tool (package name might be `netcat`).
* `jq`, a tool for querying and manipulating and JSON files.
* `git`, a tool for man

We'll help you open up the appropriate shell you will need for you system.

Windows (Admin)

```bash|{type: 'command', platform:'win32', privileged: true}
start
```

Mac/Linux:

```bash|{type: 'command', platform:'darwin'}
open -a "Terminal" .
```

After you've installed the appropriate commands, let's check if we have installed these programs on the system...

```bash|{type: 'command'}
git --version
```

```bash|{type: 'command'}
jq --version
```

```bash|{type: 'command'}
wget -V
```

[Next: Preparing your Terminal](configure-shell.md)