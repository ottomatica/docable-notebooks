[Setup](../Setup.md#setup) > Configure your terminal

# Configure your terminal

Let's check that you can run a bash shell.

```bash|{type:'command'}
bash
```

Next, let's check if your default shell can run bash-related commands.

```bash|{type:'command'}
ls
```

### Make Windows Just As Awesome

If you've failed the above, no worries, you can make windows pretty awesome, too.

*Tip*: You can also get many of the same commands available in your windows shell environment by installing git and ensuring they exist on your path.

First, we'll confirm that you do not have the linux commands provided by git in your `%PATH%`. 

```bash|{type:'command', platform: 'win32'}
REG query HKCU\Environment /F "C:\Program Files\Git\usr\bin"
```

```bash|{type:'command', platform: 'win32'}
REG query "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Session Manager\Environment" /F "C:\Program Files\Git\usr\bin"
```

Next, we'll update %PATH% so that it also contains directory with the linux binaries.

```bash|{type:'file', platform: 'win32', path:'addpath.bat'}
set "SystemPath="
for /F "skip=2 tokens=1,2*" %%N in ('REG query "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Session Manager\Environment" /v "Path" 2^>nul') do (
    if /I "%%N" == "Path" (
        set "SystemPath=C:\Program Files\Git\usr\bin;%%P"
        goto UpdateReg
    )
)
:UpdateReg
echo %SystemPath%

REG add "HKEY_LOCAL_MACHINE\System\CurrentControlSet\Control\Session Manager\Environment" /v PATH /d "%SystemPath%" /f
```

Now we can run this command in a privileged shell to add the linux commands to our path.

```bash|{type:'command', privileged: true, platform: 'win32', refresh: true}
addpath.bat
```

**Awesome**: You can check again and see that `ls` now works (if trying in your own shell, you will need to open up a new window, so that the environment updates take effect). *Caution*: If not running the above commands in a notebook, the environmental changes will not be ready right away. In this case, one simple trick is to visit the Environment Variables settings window, then clicking "Ok" to trigger a refresh.

**Why this way?** Why did we use a script, and not `SETX`, or `REG add` by directly appending `%PATH%`? `SETX` is a great command---however, it will truncate strings longer than 1024 characters, which makes it unsuitable for updating your `%PATH%` variable. Finally, using `REG add` is also problematic, as it will 1) duplicate entries from your User Environment variables, and 2) overwrite paths, such as `%SYSTEM_ROOT%`, with expanded and hard-coded values.

We can clean things up, taking advantage of our new linux command.

```bash|{type:'command', platform: 'win32'}
rm -f addpath.bat
```

### Updating bash (MacOS)

MacOS, comes with a fairly old version of bash. Even if you've switched over to `zsh` for your interactive shell, you might still find it useful to upgrade bash for scripts run on your system.

We can upgrade bash using `brew`.

```bash|{type:'command', platform: 'darwin', stream: true}
brew install bash
```

Check we have newer bash.
```bash|{type:'command', platform: 'darwin'}
/usr/local/bin/bash --version
```

We need to add our new shell to the list of trusted shells.
```bash|{type:'command', platform: 'darwin', privileged: true}
echo "/usr/local/bin/bash" >> /etc/shells
```

If you want to default to the newer bash, you can run:

```bash|{type:'command', platform: 'darwin', privileged: true, failed_when:'exitCode!=0'}
chsh -s /usr/local/bin/bash $USER
```

Our current environment will still use the old bash.

```bash|{type:'command', platform: 'darwin'}
echo $BASH_VERSION
```

However, if we open a new terminal window, and run `echo $BASH_VERSION`, we will see we have a newer shell.

```bash|{type:'command', platform: 'darwin'}
open -a "Terminal" .
```


## Activity: Customizing Your Shell

In bash, the environment variable, `PS1`, will contain the text that gets displayed by your prompt, which normally might look like `$ `. For example, setting `PS1="box > "`, will look like this.

```
box > ░
``` 

Windows (Opening a Git Bash shell):

```bash|{type:'command', platform: 'win32'}
start bash
```

Mac/Linux:

```bash|{type:'command'}
open -a "Terminal" .
```

Type in and try:

```bash
PS1="box > "
```

Or, use an emoji:

```bash
PS1="💻: "
```

Of course, more advanced options are [available], through escape code such as these, and even conditional logic and bash commands (by setting another variable `PROMPT_COMMAND`):

* `\H`: the hostname
* `\u`: the user name
* `PROMPT_COMMAND="echo -n [$(date +%H:%M)]"`: Print the date in hours and minutes.


Type in and try:

```bash
PS1="\u@[\h]: "
```

Something more dynamic:

```bash
PROMPT_COMMAND="echo -n [$(date +%H:%M)] >"
```

Create a local configuration file named `.bash_prompt`:

```bash|{type:'file',path:'.bash_prompt'}
PROMPT_COMMAND='PS1="\[\033[0;33m\][\!]\`if [[ \$? = "0" ]]; then echo "\\[\\033[32m\\]"; else echo "\\[\\033[31m\\]"; fi\`[\u.\h: \`if [[ `pwd|wc -c|tr -d " "` > 18 ]]; then echo "\\W"; else echo "\\w"; fi\`]\$\[\033[0m\] "; echo -ne "\033]0;`hostname -s`:`pwd`\007"'
```

Then enable your new prompt with:

```bash
source .bash_prompt
```

Try running a simple command, like `ls`. Notice the green prompt. Now try running a non-existing command, such as `foo`. Notice the red prompt.

**Exercise**: Customize your bash prompt. Use a google search, reference [articles](https://www.maketecheasier.com/8-useful-and-interesting-bash-prompts/), or search on GitHub for "dotfiles" as a source for inspiration.

To keep any change, you like, you can these commands in a configuration file, such as `~/.profile` or `~/.bash_rc`.

[Next: Shells](../Shells.md)  

