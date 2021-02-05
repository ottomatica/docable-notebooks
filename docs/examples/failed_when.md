# failed_when, success_message, and failure_message

The command below will echo "hello world" which should normally always be successful. However in this case, we can instruct docable to fail if stdout includes "hello" and provide `success_message` and `failure_message` as feedback.

    ```bash|{type:'command', failed_when: "stdout.includes('hello')", success_message:"Nice, you run this command successfully!", failure_message: "Uh-oh, looks like output includes 'hello' which is not expected :("}
    echo "hello world"
    ```

see the code block above rendered below:

```bash|{type:'command', failed_when: "stdout.includes('hello')", success_message:"Nice, you run this command successfully!", failure_message: "Uh-oh, looks like output includes 'hello' which is not expected :("}
echo "hello world"
```
