# Playground for windows environment

```bash|{type:'command'}
setx VAR0 "hello"
```

Testing if we can read this.

```bash|{type:'command'}
echo %VAR0%
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