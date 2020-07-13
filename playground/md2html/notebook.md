
# Yay!

```
This shoould _not_ be highlighted
``` 

```js
const a = 'this is highlighted js code but not a docable cell';
```

This is a js block which is a docable file cell...
{type: "file", path: '/tmp/foo.js'}
```js
const p = require('path');
```

and a command cell:

{type: 'command'}
```bash
foo
```

```diff
- this is a diff
+ this is not a diff
```