
Install brew.

```bash|{type:'command'}
curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh -o brew.sh
chmod +x brew.sh
cat brew.sh
```

Edit file to include your password.

```bash|{type:'file', path:'pw.sh'}
#!/bin/bash
echo 'pass'
```

```bash|{type:'command'}
chmod +x ./pw.sh
```

Run install.

```bash|{type:'command'}
cd ~ ; HAVE_SUDO_ACCESS=0 SUDO_ASKPASS=./pw.sh ./brew.sh
```

Testing privileged (Mac)
```bash|{type:'command', privileged: true}
pwd
```

Testing normal command
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

### Issues

* sudo-prompt will use process to set cwd.

```
  // Preserve current working directory:
  // We do this for commands that rely on relative paths.
  // This runs in a subshell and will not change the cwd of sudo-prompt-script.
  script.push('cd "' + EscapeDoubleQuotes(Node.process.cwd()) + '"');
```