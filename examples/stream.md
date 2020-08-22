
# Streaming commands

This is an example of a streaming command. Progress will be displayed immediately. After completion, the final results of the command output are updated.

```bash|{type:'command', stream: true}
echo "start..." && sleep 3 && echo "3 seconds later."
```

To enable streaming, simply add `stream: true` to the cell definition.

~~~bash
```bash|{type:'command', stream: true}
ls
```
~~~

Streaming is especially relevant for commands that might involve long-running commands where you might want to monitor progress. Here are some more examples using `wget`.

Some interesting notes:
* Because `wget` will print progress on stderr, we will redirect into into stdout to avoid unwanted failure.
* We ask `wget` to show the progress-bar, because otherwise it will flood the output window with very verbose download statistics.

```bash|{type:'command', stream: true}
wget https://cdn.kernel.org/pub/linux/kernel/v4.x/linux-4.17.2.tar.xz --show-progress --progress=bar:force 2>&1
```

Another interesting example, with a rate limit. This will download the Go binary, but limit the download speed to `5mb`.

```bash|{type:'command', stream: true}
wget --limit-rate=5m https://dl.google.com/go/go1.10.3.linux-amd64.tar.gz --show-progress --progress=bar:force 2>&1
```

### Issues

* We might be able to set our terminal width/column-size larger so we can reduce wrapping output.
* Investigating rewriting output when terminal rewrites could be interesting.