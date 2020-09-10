[Setup](../Setup.md#setup) > Configure your shell

# Configure your shell

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

```bash|{type:'command', privileged: true, platform: 'win32', refresh: true}
addpath.bat
```


## Activity: Customizing Your Shell

In bash, the environment variable, `PS1`, will contain the text that gets displayed by your prompt, which normally might look like `$ `. For example, setting `PS1="box > "`, will look like this.

```
box > ░
``` 

```bash|{type:'command'}
PS1="\u@[\h]: "
echo "${PS1@P}"
```

```bash|{type:'command'}
PROMPT_COMMAND="echo -n [$(date +%H:%M)] >"
echo "$($PROMPT_COMMAND)"
```

```bash|{type:'command'}
start bash
```

Of course, more advanced options are [available], through escape code such as these, and even conditional logic and bash commands (by setting another variable `PROMPT_COMMAND`):

* `\H`: the hostname
* `\u`: the user name
* `PROMPT_COMMAND="echo -n [$(date +%H:%M)]"`: Print the date in hours and minutes.

Create a local configuration file named `.bash_prompt`:
```bash
PROMPT_COMMAND='PS1="\[\033[0;33m\][\!]\`if [[ \$? = "0" ]]; then echo "\\[\\033[32m\\]"; else echo "\\[\\033[31m\\]"; fi\`[\u.\h: \`if [[ `pwd|wc -c|tr -d " "` > 18 ]]; then echo "\\W"; else echo "\\w"; fi\`]\$\[\033[0m\] "; echo -ne "\033]0;`hostname -s`:`pwd`\007"'
```

Then enable your new prompt with:

```bash
source .bash_prompt
```

Try running a simple command, like `ls`. Notice the green prompt. Now try running a non-existing command, such as `foo`. Notice the red prompt.

**Exercise**: Customize your bash prompt. Use a google search, reference [articles](https://www.maketecheasier.com/8-useful-and-interesting-bash-prompts/), or search on GitHub for "dotfiles" as a source for inspiration.

