<!--
setup:
  local:
    cwd: .
-->

# Child Processes

When writing scripts or your own configuration tools, you will often find that you will have to create new processes to help you perform a task. While might seem straightforward, there are many caveats that can quickly add up, and require a richer and deeper understanding of processes and their behavior and properties.

Let's start with a simple execution of the `date` command. We will execute the command as a child process, wait until it completes, and read its output.

```js | {type:'script'}
const child_process = require('child_process')
let output = child_process.execSync("date").toString();
console.log( output );
```

When running commands in a configuration or tool automation context, we usually need to know a little more about the status of the command, respond to any errors, parse output, or even potentially provide input. We may also have to handle issues related to passing complex data, escaping certain string characters, and dealing with various oddities associated with shells and OS platforms. Finally, we have to be mindful of the lifecycle of a process and manage any necessary concurrency constraints.

As you might imagine, this makes programming involving processes a bit more difficult.

Let's start with writing a simple function `run()` that given a command it will run it, without trying to capture and use the output:

```js | {type:'script'}
const child_process = require('child_process');

run('date');

function run(cmd) {
    child_process.execSync(cmd, {stdio : ['inherit', 'inherit', 'inherit'] });
}
```

As you can see, although we we're not getting the stdout and stderr to print them, they are still shown in the execution output of snippet above. The reason we see this command output is we passed some options to `execSync()` to specify we want the stdio (`[stdin, stdout, stderr]`) to be inherited from current process (our js script). Now try running the same snippet above but this time change `inderit` to `ignore`; you shouldn't see the command output this time.

Now that we showed some basics usage of `child_process.execSync()`, lets try something more interesting for writing scripts. In scripts we want to extract the `stdout` and `stderr` from the command output, and do something in our script based on those output. To do this we're going to use the asynchronous version of `child_process.execSync` => `child_process.exec` which returns the `stderr` and `stderr` separately to give us more control.

```js | {type:'script'}
const child_process = require('child_process');

await run('date');

async function run(cmd) {
    child_process.exec(cmd, (error, stdout, stderr) => {
        console.log( 'stdout is:', stdout );
        console.log( 'stderr is:', stderr );
    });
}
```

As you can see, the function above runs the command and prints the `stdout` and `stderr` on separate lines. Let's improve this further to also include the exit code of the command and return an object instead of printing:

```js | {type:'script'}
const child_process = require('child_process');

console.log(await run('date'));

async function run(cmd) {
    let outputObj = {};

    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (error, stdout, stderr) => {
            outputObj.stdout = stdout;
            outputObj.stderr = stderr;
        }).on('close', (code) => {
            outputObj.code = code;
            
            resolve(outputObj);
        });
    })
}
```

In this final code snippet, we return `outputObj` which contains the `stdout`, `stderr`, and `code`. Since `child_process.exec()` is asynchronous, we also had to return a Promise, to ensure `outputObj` is returned when it is ready and the command has finished running. This should be the format of output you get:

```
{ stdout: 'Wed Feb  3 14:07:08 EST 2021\n', stderr: '', code: 0 }
```

In this short tutorial, you learned how to run command inside your js script and capture the output. Now you can use this `run(cmd)` function, and decide to do different operations based on this command output.

---

## Excercise: use what you learned

Can you adapt what you learned above to check version of node on your system, then make sure it is greater than `12.0.0`? Complete below: 

> _Hint: use [semver package](https://www.npmjs.com/package/semver) for version range_

```js | {type:'script'}
const child_process = require('child_process');

// TODO...
// call run() to check version of node.js, then make sure it is > 12.0.0 })();

async function run(cmd) {
    let outputObj = {};

    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (error, stdout, stderr) => {
            outputObj.stdout = stdout;
            outputObj.stderr = stderr;
        }).on('close', (code) => {
            outputObj.code = code;
            
            resolve(outputObj);
        });
    })
}
```


> _Hint 2: To do this, first we need to run `node --version` command and use the stdout with semver package `semver.gt(stdout, '12.x.x')`._

---

### See also
- _[`child_process.spawn`](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) which is better for loger running processes_