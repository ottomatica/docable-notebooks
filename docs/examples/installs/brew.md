
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

```bash|{type:'command', stream: true}
HAVE_SUDO_ACCESS=0 SUDO_ASKPASS=./pw.sh ./brew.sh
```
