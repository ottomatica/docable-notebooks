_Want to get updates about docable? [Please click here to subscribe to our mailing list.](https://buttondown.email/ottomatica)_

_Enjoyed trying this out, saw a bug, or have some ideas  on how to improve things? [Please click here to fill out our short survey](https://forms.gle/fMe8u4zsQyRss8rx9). We will read and address every response!_

---

# Intro to Docable Notebooks

Docable Notebooks provide a way for viewing normal markdown files in an interactive and executable format. To enable this, you simply need to add some annotations to your document. For example, let's see a simple example markdown for making a `command` cell that can be executed in Docable:

~~~
This is a docable cell which represents a command:

```bash|{type:'command'}
date
```
~~~

Docable notebooks will turn the markdown above into an interactive and executable document. **_To execute the cell, simply hover your mouse over the cell and press the play button_**:

<hr style="border-top: 1px dashed gray;">

This is a docable cell which represents a command:

```bash|{type:'command'}
date
```
<hr style="border-bottom: 1px dashed gray;">

Now suppose you wrote a tutorial in markdown, this is how it would look like:

<br>

# Basic Logging in Node.JS

![image](https://user-images.githubusercontent.com/9158546/89744100-c89e4380-da77-11ea-8f34-e8e255bb5de6.png)

If you've ever written code in JavaScript before, `console.log()` is most likely one of the first things you learned to use. `console` also provides many other methods which can be useful for basic logging of different events in you code. In this notebook, we're going to see another method, `console.error()`, which can be useful for logging errors.

Let's write a simple script (`./log.js`) to better understand these methods:

```js|{type:'file', path:'log.js'}
console.log('this is a log message in stdout\n');
console.error('this is a log message in stderr\n');
```

Now if we simply run this script, it may look like `console.log()` and `console.error()` are doing the exact same thing:

```js|{type:'command', failed_when:'exitCode!=0'}
node log.js
```

So what makes these two methods different?

The main difference is the stream in which they write to. `console.log()` prints to [stdout](https://linux.die.net/man/3/stdout) while `console.error()` prints to [stderr](https://linux.die.net/man/3/stderr). When we run something in terminal, we see a stream of both stdout and stderr without any visual indication for differentiating between the two. However, we can redirect these two streams to be written in separate files:

```js|{type:'command', failed_when:'exitCode!=0'}
node log.js > /tmp/stdout 2> /tmp/stderr
```

Now if we inspect `/tmp/stdout` we can see what part of `./log.js` output was written in stdout stream:

```bash|{type:'command'}
cat /tmp/stdout
```

We can see this is what `console.log('this is a log message in stdout');` printed.


Similarly, if we inspect `/tmp/stderr` we can see what was printed to stderr stream:

```bash|{type:'command'}
cat /tmp/stderr
```

And we can see this is what `console.error('this is a log message in stderr');` printed.

---

_Enjoyed trying this out, saw a bug, or have some ideas  on how to improve things? [Please click here to fill out our short survey](https://forms.gle/fMe8u4zsQyRss8rx9). We will read and address every response!_
