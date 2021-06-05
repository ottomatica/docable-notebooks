# Terminal

Docable notebooks supports Terminal cells, ([Repl and Shells](#repl-and-shells)) for advanced usage including custom REPL cells and shells.

### Example

Run a command to write "Hello World!" in `/tmp/hello.txt`:

```|{type:'command'}
echo "Hello World!" > /tmp/hello.txt
```

Type `cat /tmp/hello.txt` in terminal below to check the result of command cell above:

```|{type:'terminal'}
```

## Creating a terminal

Creating a Terminal cell is easy, simply set the cell type to `terminal`

    ```|{type:'terminal'}
    ```

This will create a terminal shell for your platform's default shell (powershell on `win32`, otherwise bash).

## Run commands in the terminal on load

The content of the terminal cell will automatically run when the terminal loads. For example the terminal created as below, will start a bash session and run `ls -al` command as soon as it loads.

    ```|{type:'terminal', command: 'bash'}
    ls -al

    ```

## REPL and Shells

You can also specify your desired shell (`zsh`, etc) or REPL when creating the terminal cells. This can be done in two ways.

1. Using the `command` property (set to `zsh`, `python`, `node`, `redis`, `mysql` etc as long as supported in your environment)

        ```|{type:'terminal', command: 'node'}
        ```

2. By setting the cell's "language"

        ```node|{type:'terminal'}
        ```

If both `command` property and language are set, `command` will take precedence. For instance, the cell below will show a node REPL not python.

    ```python|{type:'terminal', command: 'node'}
    ```

Here is a node REPL as example:

```|{type:'terminal', command: 'node','background-color': '#000'}
let a = 1;
a
a + 3

```

Here is a python REPL:

```|{type:'terminal', command: 'python'}
```

Here is a Ruby REPL (irb):

```|{type:'terminal', command: 'irb'}
```

And here is a Java REPL (JShell):

```|{type:'terminal', command: 'jshell'}
```
