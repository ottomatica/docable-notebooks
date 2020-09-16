
# Run commands in shell

List the current directory contents.

```bash|{type:'command', shell:'bash'}
ls
```

```bash|{type:'command', shell:'bash'}
echo "'hello'" | grep -c "'hello'"
```

```bash|{type:'command', shell:'bash'}
ls -R | grep ":$" | sed -e "s/:$//" -e "s/[^-][^\/]*\//--/g" -e "s/^/ /" -e "s/-/|/"
```

```bash|{type:'command', shell:'bash'}
tmpfile=$(mktemp)
cat << 'END_DOC' > $tmpfile
Temp file content
END_DOC
echo $tmpfile
cat $tmpfile
```