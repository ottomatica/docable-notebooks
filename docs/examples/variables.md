<!-- 
targets:
    - type: docker
      name: command-example
      image: node:12-buster
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

### Defining variables

To declare a variable, simply provide the name in a comma-seperated list. Then inside the cell body, you can refer to the variable 
using `{{variable-name}}`.

~~~bash
```bash|{type:'command', variables: 'foo, bar'}
echo "{{foo}} world"
```
~~~

### Secret variables

For sensitive variables, such as passwords, tokens, and ssh keys, you can check the "Secret" checkbox. While all variables are encrpyted when stored on server, when marked secret, they will be masked when displayed in output.

```bash|{type:'command', variables: 'secret_token'}
echo {{secret_token}}
```