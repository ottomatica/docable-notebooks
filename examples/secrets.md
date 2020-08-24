<!-- 
setup:
    docker: command-example
-->

# Using secret variables

This runs successfully if you have created a secret with slug = foo. You can do that in http://localhost:3000/secrets.
```bash|{type:'command', secrets: 'foo'}
echo "{{foo}} bar"
```

This fails, because the annotation specifies `secrets: 'foo,bar`, however a secret with this slug does not exit.

```bash|{type:'command', secrets: 'foo,bar'}
echo "foo {{bar}}"
```

