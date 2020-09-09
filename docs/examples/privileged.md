# Privileged command

Run a privileged command (command in elevated shell).

```bash|{type:'command', privileged: true}
ls -l
```

Testing privileged commands with stream.

```bash|{type:'command', privileged: true, stream: true}
echo "hello" && sleep 9 && echo "9 seconds later" && echo "end"
```

Testing privileged commands with stream and stderr.

```bash|{type:'command', privileged: true, stream: true}
echo "hello error" >&2 && sleep 3 && echo "3 seconds later" >&2 && echo "end error" >&2
```

Extreme stream.

```bash|{type:'command', privileged: true, stream: true}
wget https://cdn.kernel.org/pub/linux/kernel/v4.x/linux-4.17.2.tar.xz --show-progress --progress=bar:force
```

Testing privileged, pwd.
```bash|{type:'command', privileged: true}
pwd
```

Testing normal command, pwd
```bash|{type:'command'}
pwd
```

Testing variable expansion.

```bash|{type:'command'}
FOO="$(echo 'vars')"; echo $FOO
```

Testing variable expansion (privileged)
```bash|{type:'command', privileged: true}
FOO="$(echo 'vars')"; echo $FOO
```