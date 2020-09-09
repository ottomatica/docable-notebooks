# Privileged command

Run a privileged command (command in elevated shell).

```bash|{type:'command', privileged: true}
ls -l
```

Testing privileged commands with stream.

```bash|{type:'command', privileged: true, stream: true}
echo "hello" && sleep 9 && echo "9 seconds later" && echo "end"
```

Extreme stream.

```bash|{type:'command', privileged: true, stream: true}
wget https://cdn.kernel.org/pub/linux/kernel/v4.x/linux-4.17.2.tar.xz --show-progress --progress=bar:force
```