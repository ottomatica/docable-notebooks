
# Run commands in shell

Run in bash shell.

```bash|{type:'command', shell: 'bash'}
tmpfile=$(mktemp)
cat << 'DOCABLE_END_DOC' > $tmpfile
Temp file content
DOCABLE_END_DOC
echo $tmpfile
cat $tmpfile
```