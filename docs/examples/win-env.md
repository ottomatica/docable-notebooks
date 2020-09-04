# Playground for windows environment

```bash|{type:'command', refresh:true}
setx VAR1 "hello world"
```

Use chocolately helper function.

```bash|{type:'command'}
RefreshEnv
```

Testing if we can read this.

```bash|{type:'command'}
echo %VAR1%
```

Get all variables.

```bash|{type:'command'}
SET
```

Read directly from registry

```bash|{type:'command'}
REG query HKCU\Environment
```

Helper for deleting variable.

```bash|{type:'command'}
REG delete HKCU\Environment /F /V VAR0
```

Useful resources:
https://stackoverflow.com/questions/13222724/command-line-to-remove-an-environment-variable-from-the-os-level-configuration

https://superuser.com/questions/1179433/how-to-list-global-environment-variables-separately-from-user-specific-environme

https://stackoverflow.com/questions/171588/is-there-a-command-to-refresh-environment-variables-from-the-command-prompt-in-w