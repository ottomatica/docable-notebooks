<!-- 
setup:
    docker: command-example
-->

# Using variables

This runs successfully if you have created a variable called `foo`. You can manage variables on [/variables](/secrets).

```bash|{type:'command', variables: 'foo'}
echo "{{foo}} world"
```

This fails, because the annotation specifies `secrets: 'foo,bar`, however a secret with this slug does not exit.

```bash|{type:'command', variables: 'foo,bar'}
echo "foo {{bar}}"
```

