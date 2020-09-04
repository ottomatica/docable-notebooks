
# Create a file, then edit it.

Create the configuration file.

```ini|{type: 'file', path:'/tmp/config.ini' }
IP=<fill in>
OTHER=NONE
```

Set the ip address.

```diff|{type: 'edit', path:'/tmp/config.ini'}
@@ -1,2 +1,2 @@
-IP=<fill in>
+IP=192.168.33.10
 OTHER=NONE
```

Verify edit.

```bash|{type:"command",failed_when:"!stdout.includes('192.168.33.10')"}
cat /tmp/config.ini
```