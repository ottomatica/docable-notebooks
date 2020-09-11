[Setup](../Setup.md#setup) > Install homebrew

# Install homebrew.

This will download a bash script and save to "brew.sh".

```bash|{type:'command'}
curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh -o brew.sh
```

We then will make sure the file is exectuable, and then print it out so we can inspect it.
```bash|{type:'command'}
chmod +x brew.sh
cat brew.sh
```

### Homebrew install asks for a password?

The homebrew install script, when run in a shell, will prompt the user for a password.

We will bypass this interactive prompt, with an automated method. We will create a simple bash script that will provide the password when prompted, indicated by the `{{local_admin_password}}` variable.

```bash|{type:'file', path:'pw.sh', permission: "+x", variables: "local_admin_password"}
#!/bin/bash
echo {{local_admin_password}}
```

### Ready to install

Then the environment variable `SUDO_ASKPASS` is used by the homebrew script to get the password. `HAVE_SUDO_ACCESS` is also provided to help the homebrew script logic use our password script.

```bash|{type:'command'}
SUDO_ASKPASS=./pw.sh HAVE_SUDO_ACCESS=0 ./brew.sh
```

We should now be able to run `brew`!

```bash|{type:'command'}
brew -v
```

Once everything is done, will we clean up a few things.

```bash|{type:'command'}
rm -f ./brew.sh ./pw.sh
brew cleanup
```

[Next: Package Managers](package-managers.md)