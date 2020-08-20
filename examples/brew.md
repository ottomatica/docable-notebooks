
Install brew.

```bash|{type:'command', privileged: true}
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"
```

Testing privileged (Mac)
```bash|{type:'command', privileged: true}
ls
```

Testing variable expansion.

```bash|{type:'command'}
FOO="$(echo 'vars')"; echo $FOO
```

Testing variable expansion (privileged)
```bash|{type:'command', privileged: true}
FOO="$(echo 'vars')"; echo $FOO
```

