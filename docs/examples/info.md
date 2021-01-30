# Simple info cell

An `{type: 'info'}` cell is useful for creating cells that display some extra information without being executable. For example, this can be useful for combining with `range` annotations to highlight a part of an expected output.

```bash|{type:'info', range: {start:5, end: 6}}
$ ls -la
total 4568
-rw-r--r--    1 foo  staff    11340 Sep  4 19:21 LICENSE
-rw-r--r--    1 foo  staff     7745 Sep 28 21:17 README.md
-rwxr-xr-x    1 foo  staff     8841 Jan 28 18:23 index.js
-rw-r--r--    1 foo  staff   199945 Jan 26 14:46 package-lock.json
-rw-r--r--    1 foo  staff     1991 Jan 30 14:23 package.json
```
