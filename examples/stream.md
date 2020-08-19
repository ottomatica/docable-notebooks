
# Streaming commands

This is an example of a streaming command. Progress will be displayed immediately. After completion, the final results of the command output are updated.

Some interesting notes:
* Because `wget` will print progress on stderr, we will redirect into into stdout to avoid unwanted failure.
* We ask `wget` to show the progress-bar, because otherwise it will flood the output window with very verbose download statistics.

```bash|{type:'command', stream: true}
wget https://cdn.kernel.org/pub/linux/kernel/v4.x/linux-4.17.2.tar.xz --show-progress --progress=bar:force 2>&1
```

