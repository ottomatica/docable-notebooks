<!-- 
setup:
    docker: command-example
-->

# Using variables

This runs successfully if you have created a variable called `foo`.

```bash|{type:'command', variables: 'foo'}
echo "{{foo}} world"
```

If `bar` is not defined, an error will be displayed. 

```bash|{type:'command', variables: 'bar'}
echo "hello {{bar}}"
```

Define `bar` in the box at the top of the page and try to run again. 
You can also manage variables available in any notebook at [/variables](/variables).

### Create file with variable content.

You can also use variables inside `file` cells, which allow you to use notebooks for your custom content.

```ini|{type:'file', variables: 'bar', path: 'myfile.txt'}
USER={{bar}}
```

```bash|{type:'command'}
cat myfile.txt
```

