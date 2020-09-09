
# Yay!

```
This shoould _not_ be highlighted
``` 

```js
const a = 'this is highlighted js code but not a docable cell';
```

This is a docable file cell... that can be used to create file content.
```js|{type:"file",path:'random_id.js'}
console.log( Math.random().toString(36).substring(2) );
```

and a command cell, that can be run.

```bash|{type:'command'}
node random_id.js
```