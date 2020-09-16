[Setup](Setup.md#setup) | [Shells](Shells.md#shells) |  [Git](Git.md#git) | [Markdown and IDEs](MarkdownEditors.md#markdown) |  [Virtual Environments](Environments.md#environments) | [Task Management](OnlineTools.md#online-tools)

# Shells

A shell is a computing environment where commands can be interpreted, evaluated, and its output displayed (i.e., an instance of a read–eval–print loop (REPL)). A good shell provides access to a rich set of commands and allows simple programming of commands, which can be used to create powerful scripts and tools.

```bash|{type:'command'}
ls -R | grep ":$" | sed -e "s/:$//" -e "s/[^-][^\/]*\//--/g" -e "s/^/ /" -e "s/-/|/"
```

**But with great power comes great bullshittery**. Commands and their options can be [terse, inconsistent, and difficult to learn](http://www.pgbovine.net/command-line-bullshittery.htm). A steep learning curve often prevents novices from enjoying the eventual payoff. If you've hardly used a command line environment before, you might want to go review this more thorough tutorial:
[software carpentry: shell-novice](http://swcarpentry.github.io/shell-novice/index.html)---this page is more of a discussion of common tasks and mistakes, advanced topics, and resources.

You may also want to reference the online book, [the Unix Workbench](https://seankross.com/the-unix-workbench/).

## Shell Basics

Depending on your operating system and desktop manager, you have many ways to open up a shell. There may even be several different choices for shell programs.

### Accessing and Using Shells

* **Mac**: you can run the Terminal in Applications and pin to your Dock.

* **Windows**: You access a shell in several ways. You can right click on the Windows Icon in the Task Bar and open a terminal window. You can also type in the name of the shell program in the search bar (e.g., Cmd/Powershell). 

*Tip*: IDES, such as VS Code provide easy access to a terminal (View ⇨ Terminal).


### Privileged commands

Some commands require adminstrative or super user privileges.

* **Mac/Linux**: To access a privileged shell, you simply can run `su` or prepend a command with `sudo`. `sudo` will cache your password, typically for 5 minutes, after successfully running a command. To avoid typing a password at all, you may add your user to `/etc/sudoers`---note it is recommended you make changes to this file using the special utility: [visudo](https://www.digitalocean.com/community/tutorials/how-to-edit-the-sudoers-file).

* **Windows**. If you need to run a command with admin, you must start a shell with admin privilege. There is typically an admin command shell available in the menu when right clicking the Windows Icon on the Task Bar. You can also get one from right clicking the Cmd executable in the search bar.

   *Tip*: If opening up a cmd shell in admin mode, make sure you do not perform operations, such as `git clone` in your current directory (`C:\WINDOWS\system32`). Otherwise, you will be writing to a location that only admin will have access to which will make it difficult to run the commands/tasks you are intending on doing.

### Deciding on a Terminal/Shell for Windows

In windows, you can use Cmd, Powershell, or emulated shells, such as Bash for Git, or Bash with Windows Linux Subsystem (WSL). 

`Cmd` is tried and true, and if you [made windows awesome](setup/configure-shell.md), will mostly what you want to do. The downsides are that interactions such as copy/paste are a little clunky. However, if open up a terminal with Cmd through Code, then this problem is mostly eliminated. `Powershell` is a powerful shell, with great scripting support. However, the syntax is esoteric and inconsistent with any other shell you may use. For example, running common linux commands like `cd ~ && ls` does not work in Powershell.

Enumlated shells are useful for getting a _linux-like_ experience in Windows. Unfortunately, there are **many downsides to using emulated shells**. One downside is that you may be limited in accessing other executables/environments on windows. 
For example, with `WSL`, you are actually running commands inside a small virtual machine, which limits your ability to run commands from windows. In general, using `WSL`, will turn on Hyper-V, which essentially breaks virtualization for tools, such as VirtualBox. In `Git Bash`, node packages and environment settings you setup will not work as expected when running in Cmd/etc. Furthermore, you never truly escape Windows, for example, Windows style newline endings `'\r\n'` may exist in files you edit, which will break bash scripts. Another common problem is that when you install packages, you will often get libraries for linux binaries, which then will not work when running outside of the emulated shell.

As a result, emulated shells seem helpful, but often create more problems than they solve.

*Tip*: Personal recommendation---stick with `Cmd` for system installation, and use a virtual machine if you truly need a linux environment.

### Commands

99% of the reason you use shells is to run useful commands.

##### Essential commands.

* **`ls`**: list content of a directory.
* **`cd`**: change directories to a new path.
* **`mkdir`**: make a new directory.
* **`pwd`**: output current directory
* **`cp`**: copy files
* **`rm`**: rm files
* **`touch`**: make a new file/update status**
* **`cat`**: output the contents of a file.
* **`head`**: output the first lines of a file.
* **`tail`**: output the last lines of a file.
* **`grep`**: search files for a key phrase.
* **`wget`**: retrieve file from the web.
* **`cut`**: extract output of a file (columns)
* **`awk`** and **`sed`**: Magic commands for extracting, searching, and transforming content.

##### Combining commands

Command can run sequentially or conditionally:

```bash
command1 ; command2
(command1 ; command2) # in a sub-shell
command1 || command2  # do command2 only if command1 fails
command1 && command2  # do command2 only if command1 succeeds
```

*Note*: In Windows, `;` does not work in Cmd, but does in Powershell. Use `&&` for the most portable operation.

Try running this command that combines these shell commands.

```bash|{type: 'command'}
echo "Hello World" > shells-test.txt && cat shells-test.txt
```

Now, try using the `||` operator. 

```bash|{type: 'command', }
cat shells-test.txt || echo "backup plan"
```

See what happens in this case.

```bash|{type: 'command', failed_when: "!stdout.includes('backup plan')"}
cat filedoesnotexist.txt || echo "backup plan"
```

##### Command I/O

The UNIX shell commands push data from sources through filters along pipes. Normally, each command runs as a process and reads and writes data the following way:

* **Standard input (stdin)**: get information from keyboard.
* **Standard output (stdout)**: write information as output to console.
* **Standard error (stderr)**: write error information as output to console.

Pipes and redirects change stdin and stdout from default sources. For example, we can change the stdin of a process to be piped from the output of another process. Or rather than printing to the console, we can get a process to write to a file.

```bash
command              # default standard in and standard out
command < inputFile  # redirect of inputFile contents to command as standard in
command > outputFile # redirect command output to outputFile as standard out
command1 | command2  # pipes output of command1 as standard in to command2
```

**Neat trick**: Copy the value of a file into your clipboard!

Windows: `clip < file.txt` Mac: `pbcopy < file.txt` 

```bash|{type:'command', platform: 'darwin'}
pbcopy < ~/.ssh/id_rsa
```

```bash|{type:'command', platform: 'win32'}
clip < %HOME%/.ssh/id_rsa
```

## Activity: Data Wrangling with bash

Download data with `wget`.

```bash|{type:'command', stream: true}
wget -nc https://s3-us-west-2.amazonaws.com/producthunt-downloads/ph-export--2016-04-01.tar.gz --show-progress --progress=bar:force 2>&1
```

Create a directory to store the tar file contents

```bash|{type:'command'}
mkdir product-hunt 
```

Extract the archive and verify csv files exist inside the product-hunt folder.

```bash|{type:'command'}
tar -zxvf ph-export--2016-04-01.tar.gz -C product-hunt/
ls product-hunt/
```

Data wrangling. 

List the column headers inside the "users.*.csv" file

```bash|{type:'command'}
head -n 1 product-hunt/users--2016-04-01_14-36-26-UTC.csv
```

Extract a column of text from a file, using `cut`, skip over first line with `tail`, and then preview first 10 rows with `head`.

```bash|{type:'command'}
cut -f 4 -d ';' product-hunt/users*.csv | tail -n +2 | head 
```

*Note*: You may notice an error from this last command (`exit code: 141`) or a "write error" message in stderr. This is normal and expected behavior. After processing the first 10 lines of text, `head` will terminate, meaning that output that the previous commands was sending was suddenly closed, resulting in a `SIGPIPE`. If we wanted to make sure that we only received the contents of the file, and not stray warnings, we could redirect only stdout by using `1>`. 

Similiarly, we could ignore any warning output by redirecting stderr into `/dev/null` or `NUL` in **Windows**: 

```bash|{type:'command', platform: 'win32'}
cut -f 4 -d ';' product-hunt/users*.csv 2> NUL | tail -n +2 2> NUL | head 
```

In bash, if we wanted to know the exit code of different parts of the command chain, we could get an array of exit codes using `echo ${PIPESTATUS[@]}`. Finally, we can toggle this behavior by setting `set -o pipefail` to turn pipe failure _on_, and `set +o pipefail` to turn it _off_.

In bash:
```bash|{type:'command', shell: 'bash'}
set +o pipefail
cut -f 4 -d ';' product-hunt/users*.csv | tail -n +2 | head 
echo "Exit codes: ${PIPESTATUS[@]}"
```

#### Exercise: Data Science with Bash

Using a combination of `cut`, `wc`, `head`, `tail`, `grep`, `sort`, `uniq`, pipes (`|`) and any other unix suitable commands, create a command that calculates the following.

**Extend the following commands** to try to accomplish each task:

1. Count the number of columns inside the "users.*.csv" file.

```bash|{type:'command', shell: 'bash', failed_when:"!stdout.includes('14')"}
head -n 1 product-hunt/users--2016-04-01_14-36-26-UTC.csv | tr ';' '\n'
```

2. Count the number of times "bitcoin" is referenced inside a the post's file "tagline" column. Tagline is the 4th column.

```bash|{type:'command', shell: 'bash', failed_when:"!stdout.includes('42')"}
cut -f 4 -d ';' product-hunt/posts--*.csv | head
```

3. Find the row of post with the highest number of votes (`votes_count`, 7th column).

```bash|{type:'command', shell: 'bash', failed_when:"!stdout.includes('Startup Stash;A curated directory of 400 resources & tools for startups')"}
# 
```

*Warning*: While this can be useful for quick and dirty analysis, for more serious processing, you will want to use a more robust csv parser. For example, using `awk` to count the number of fields (NF) seperated by `;`, we can see, that some data may be incorrect. This is because quoted semi-columns are not being escaped by the bash commands.

```bash|{type:'command', shell: 'bash', failed_when:"!stdout.includes('14')"}
awk -F';' '{print NF}' product-hunt/users--2016-04-01_14-36-26-UTC.csv | sort | uniq
```

## Environment Variables

Environment variables are dynamically configurable elements that are available to processes on your system.

Mac/Linux: `echo $PATH`
Windows: `echo %PATH%`

A common problem with shells is that changing your `PATH` or other environment variables after an installation/OS GUI change will not affect any currently open shells. You either have to manually refresh the shell or open a new one. 

##### Setting Environment Variables (Windows)

In addition to editing environment variables in your desktop manager GUI, you can also set environment variables in your shell.

In Windows, you can use `set` and `setx` to update environment variables. `set` will update environment variables in your current shell instance, but that will be lost after the shell closes. Using `setx`, you can permanently, set an environment variable for the user or system (use `setx /m`). See the [documentation](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/setx) for more information.

```bash|{type:'command'}
set DEBUG_MODE=true
echo "Current DEBUG_MODE=%DEBUG_MODE%"
```

Tip: One limitation of using setx is that it cannot store values longer than 1024 characters.

##### Setting Environment Variables (Mac/Linux)

In bash/*sh environments, you can set temporary environment variables in two ways:

Like `set`, you can define a variable just for your shell session, but not for running programs.

```bash|{type:'command'}
DEBUG_MODE=true
echo $DEBUG_MODE
node -e 'console.log(`DEBUG_MODE=${process.env.DEBUG_MODE}`);'
```

##### Scoping

You can also define a variable that will only exist inside a subprocess spawned from the shell. **This may not behave the way you expect**!

```bash|{type:'command', shell:"bash"}
DEBUG_MODE=true echo "DEBUG_MODE=$DEBUG_MODE"
DEBUG_MODE=true node -e 'console.log(`DEBUG_MODE=${process.env.DEBUG_MODE}`);'
```
A blank is printed out because `$DEBUG_MODE` is expanded before the process executing the echo command is started. On the other hand, inside the node program, the process inherits the shell's environment variables, including the DEBUG_MODE variable.

Finally, you can enable access to an environment variable for all processes and subprocesses started in the shell by using `export VAR=VALUE`

```bash|{type:'command'}
export DEBUG_MODE=true
echo $DEBUG_MODE
node -e 'console.log(`DEBUG_MODE=${process.env.DEBUG_MODE}`);'
```

> *Permenant environment variables are actually more tricky in Mac/Linux shells!*

When a shell is initialized, several startup scripts are run for customization and initialization. If you want to make a variable always available, a common strategy is to locate one of these initialization scripts (typically in your home directory, and editing them to run your commands on startup). Common locations include: `~/.profile`, or `~/.bashrc`. The symbol `~`, is a shortcut for your home directory: `/home/<user>`.

To summarize (Mac/Linux):

* Use `export VAR=VALUE` to enable a variable to be seen by all executed commands.
* Use `VAR=VALUE` for a variable only available in the shell.
* Use `VAR=VALUE <command>` for a variable only available to that command.
* Set permenant variables inside a start script such as `~/.bashrc`.

## Advanced: Shell Programming

Once you have a set of commands or steps you perform frequently enough, you might find it useful to put into a bash script, including:

* Data collection scripts for mining data; data processing and cleaning scripts.
* Set up a local server, vms or containers, or anything else needed to test or run a complex application.
* Provision and deploy an application on a remote server.

While you do these all in the context of a interactive shell, some of the following are particular useful for writing multiple lines of scripts.

Useful conditionals and loops:

```bash
if command; then
   commands
fi

[ -z "$var" ] && echo "var is undefined" || echo "var is defined"

while command; do
  commands
done
```

Storing variables and results of commands; referencing variables

```bash
e=expansion
e=$(command)
$e
echo "result is: $e"
```

**Activity**: Imagine you wanted to write a "dead" startup checker using the product hunt data. Using the script below, you would be able check if a startup's url was still alive. Create an executable file called 'checker.sh', that is `chmod +x checker.sh`.

```bash|{type: 'file', path: 'checker.sh', permission: '+x', range: {start:3, end: 6}}
#!/bin/bash

# Print error message and exit with error code 1
function die {
    echo "$1"
    exit 1
}

# Check the number of arguments
[ $# -ge 1 ] || die "usage: $0 <posts-file> [num]"

# Assign commmand line parameters
POSTS_FILE=$1
# If no number is provided, use default value of 10
NUMBER=$([ -z "$2" ] && echo "10" || echo $2)

# Make sure that the posts file exists
[ -f $POSTS_FILE ] || die "Input file ($POSTS_FILE) not found"

echo "Checking first $NUMBER in $POSTS_FILE"

# Skip first line (delete with sed), and retrieve first n results with head.
RESULTS=$(sed 1,1d $POSTS_FILE | head -n $NUMBER)

# Loop over each line of input (provided below with <<< "$RESULTS")
while read -r line; do

    #Retrieve the product name and url from line.
    name=$(echo $line | cut -f3 -d ';')
    redirect_url=$(echo $line | cut -f9 -d ';')

    # Make a request to the url and store the reported status code.
    HTTPCODE=$(curl -L -s -o /dev/null -w "%{http_code}" $redirect_url)

    # Print the results. 404 equals dead link!
    DEAD=$([ "$HTTPCODE" == "404" ] && echo " (💀)")
    echo "$name$DEAD: $redirect_url => $HTTPCODE"

done <<< "$RESULTS"
```

Run the script:

```bash|{type:'command', shell: 'bash'}
./checker.sh product-hunt/posts--2016-04-01_14-36-24-UTC.csv 3
```

You should see output like this:

```
Checking first 3 in product-hunt/posts--2016-04-01_14-36-24-UTC.csv
We Are Heroes (💀): http://www.producthunt.com/l/b3443c7ac79b50 => 404
Tesla Model 3: http://www.producthunt.com/l/3843d5a8440dc8 => 200
Captain Strike (💀): http://www.producthunt.com/l/45fad46fe3f810 => 404
```

**Exercise**: Try running the script with a larger number of posts to check. How did it go?

**Exercise**: Go through the script line-by-line with a partner. Do you understand what each line is doing? Which ones are confusing?

## Weird but useful features and commands in bash

### Heredoc

In some situations, you might need to send multi-line content as input to a command or to store as a file. `heredoc` is an input mechanism that allows you to enter in text (interactively or in a script), until a delimiter string is reached `'END_DOC'`.  The single quotes in the heredoc marker is important---that will make sure your script commands are properly escaped.

```bash|{type:'command', shell: 'bash'}
cat << 'END_DOC' > .functions
mostUsed()
{
history | awk '{CMD[$2]++;count++;}END { for (a in CMD)print CMD[a] " " CMD[a]/count*100 "% " a;}' | grep -v "./" | column -c3 -s " " -t | sort -nr | nl |  head -n10    
}
END_DOC
```

Load the defined function. Then we can see which command you run the most.

```bash|{type:'command', shell: 'bash'}
source .functions
mostUsed
```

Heredoc can also be useful for running command on input you'd like to type in manually or paste from your clipboard and don't want to bother placing in a file. In this case, we can omit the single quotes for our heredoc marker `EOF`, since we're only processing simple text without bash commands.


Count the number of lines, words, and characters in text:

```bash|{type:'command', shell: 'bash'}
cat << EOF | wc
Lieutenant-General Sir Adrian Paul Ghislain Carton de Wiart (5 May 1880 – 5 June 1963), 
was a British Army officer of Belgian and Irish descent. He fought in the Boer War, World War I, and World War II, 
was shot in the face, head, stomach, ankle, leg, hip and ear, survived a plane crash, tunneled out of a POW camp, 
and bit off his own fingers when a doctor wouldn’t amputate them. 
He later said "frankly I had enjoyed the war."
EOF
```

### dd

`dd` can be useful for cloning disk drives or disk images, creating test data, and just generally wrecking havoc on disks (which could be useful for chaos engineering experiments).

Create a 1MB file with zeros.

```bash|{type:'command', failed_when:'exitCode!=0'}
dd if=/dev/zero of=zeros.txt count=1024 bs=1024
```

Create a 20K file with random bytes.

```bash|{type:'command', failed_when:'exitCode!=0'}
dd if=/dev/urandom of=random.txt bs=2048 count=10
```

### expect

<!-- Helpful: https://superuser.com/questions/1166920/how-do-i-send-the-stdout-of-a-command-to-an-expect-input -->

Expect the unexpected. If you need to automate a command which could prompt for input, then you can use `expect` to help respond to that input.

Just as a simple example, if you ran this code `python -c "print( input('Enter value: ') )"`, it will wait around until you typed something, which could be a problem if you're doing this 1000s of times or run in an automation script.

By using expect, you can create scripts that automatically response to prompt inputs.

Warning: `expect` is not directly available on Windows.

```bash|{type:'command', shell: 'bash'}
expect <<- END
    spawn python -c "print( input('Enter value: ') )"
    expect {
        "Enter value: " { send "42\r"}
    }
    interact
END
```

Expect is pretty tricky to learn how to use properly, but it is a nice trick to hold on to in case you need it one day.

### Traps

Using traps for [resource cleanup](http://redsymbol.net/articles/bash-exit-traps/), or implementing a singleton process.





Install simple server.
```bash|{type: 'command'}
npm install http-server -g
```

Save the following in 'server.sh' and make it executable.

```bash|{type: 'file', path: 'server.sh', permission: '+x'}
#!/bin/bash

LOCKFILE=510-bash.lock

# Exit if lockfile 
[ -f $LOCKFILE ] && echo "Lockfile is in use. Exiting..." && exit 1 

# Upon exit, remove lockfile.
function cleanup
{
    echo "cleaning up"
    rm -f $LOCKFILE
    exit 0
}

# Initiate the trap
trap cleanup EXIT SIGINT

# Create lockfile
touch $LOCKFILE

# Simple web server (listen on port 8888)
# while true; do { echo -e "HTTP/1.1 200 OK\n\n$(date)"; } | nc -l 8888; done
http-server -p 8888
```

This will run a simple webserver, spawned in its own process.

```bash|{type:'command', shell: 'bash', spawn: true}
./server.sh
```

To see what's being served, in a new terminal window, run:

```bash|{type:'command'}
wget -qO- localhost:8888
```

If you try running `./server.sh` in another terminal, it should prevent you from running again.

```bash|{type:'command', shell: 'bash'}
./server.sh
```

Let's stop our server (Windows): *Note*: this is a nice example where powershell's scripting powers come into good use.
```bash|{type:'command', platform: 'win32', shell: 'powershell'}
Get-CimInstance Win32_Process -Filter "CommandLine LIKE '%http-server%'" | Remove-CimInstance
```

Let's stop our server (Mac/Linux)
```bash|{type:'command'}
pkill -f 'http-server'
```

Let's confirm lock file is removed:

```bash|{type:'command'}
test -f 510-bash.lock && echo "file exists." && exit 1 || echo "file is gone."
```





## Remote connections

In many situations, you may find that you need to run commands for development or debugging on remote servers. Most likely, you will initate this connection over a ssh connection.

### Running remote commands

`ssh` allows you to execute commands on a remote server, such as these commands to install nodejs:

```
ssh vagrant@192.168.33.10 sudo apt-get update && sudo apt-get install nodejs -y
```

**Persistance**: If you need to change directories, you will need to do it in the same command: `cd App/ && cmd`.

Otherwise, your next command will start back in the same original directory. Because you're sending commands over ssh, this is done in `exec` mode. In exec mode, each command will be executed in its own context and lose many of the shell's functionality. ssh can operate in a `shell`, `exec`, or `subsystem` [channels](https://stackoverflow.com/questions/6770206/what-is-the-difference-between-the-shell-channel-and-the-exec-channel-in-jsc). When using a shell channel, you can interactively send commands like a normal shell. A cd operation will persist in this case. 

Finally, you can emulate some parts of a terminal using `-t or -tt` as well as combining with heredoc to input a multi-line script.

### tmux

When issuing a long running command (package installation, build job), you may find your connection drop, which could result in termination of your command!

A useful strategy to avoid this is to use a session manager, such as `screen` or `tmux`. These tools will allow you to create sessions that will persist on the server, allowing you to run commands, disconnect, and return again.

Here is a useful [reference](http://hyperpolyglot.org/multiplexers).

|  | screen |	tmux|
|--|--------|-------|
|create session and attach|	`$ screen`	| `$ tmux`
|create session _foo_ and attach	| `$ screen -S foo`	| `$ tmux new -s foo`
| create detached session _foo_ |	`$ screen -S foo -d -m`	| `$ tmux new -s foo -d` |
| list sessions	| `$ screen -list` |	`$ tmux ls` |
| attach |	`$ screen -r`	| `$ tmux attach` |
| attach to session _foo_	| `$ screen -r foo`	| `$ tmux attach -t foo` |
| attach to session by _pid_ |	`$ screen -r pid`	|
| kill session _foo_	| `$ screen -r foo -X quit` |	`$ tmux kill-session -t foo` |
| send multiplexer command to session _foo_ |	`$ screen -r foo -X command` |	`$ tmux command -t foo` |
| run `ls` in session _foo_	 | `$ screen -r foo -X stuff "ls $(echo -ne '\015')"`	| `$ tmux send-keys -t foo 'ls' C-m` |
| run `vi` in new window	| `$ screen vi /etc/motd`	| `$ tmux new-window vi /etc/motd` |

## Resources

### Bite Size Command Line Zine

You might find Julia Evan's zine useful: [Bite Size Command Line!](https://jvns.ca/blog/2018/08/05/new-zine--bite-size-command-line/).

Here is an example for the `lsof` command. More examples can be found [here](https://twitter.com/i/moments/1026078161115729920).

![lsof](https://pbs.twimg.com/media/DjFb_FPX4AAOwpa?format=jpg&name=medium)

### Command Line Fu

A list of command line examples for interesting tasks:  
http://www.commandlinefu.com/commands/browse

Create a graphical directory tree from your current directory.
```
ls -R | grep ":$" | sed -e 's/:$//' -e 's/[^-][^\/]*\//--/g' -e 's/^/ /' -e 's/-/|/'
```

### Explain shell

What does `tar -zxvf ph.tar.gz` do?

http://explainshell.com/explain?cmd=tar+-zxvf

![image](https://cloud.githubusercontent.com/assets/742934/15635713/8fc9cf7e-25b4-11e6-957e-0bb03756b9fb.png)
