### Instructions for installing Chocolately

Let's see if we already have `choco` installed?

```bash|{type: 'command', platform:'win32', failed_when:"!stdout.includes('Chocolatey v')"}
choco --V
```

Before we install `choco`, we are going to check your execution policy for your machine, which determines what scripts or software are allowed to run.

We are going to run the following command in the `powershell` shell, and check that scripts aren't `Restricted`.

```bash|{type: 'command', platform:'win32', shell: 'powershell', failed_when: "stdout.includes('Restricted')"}
Get-ExecutionPolicy
```

`Set-ExecutionPolicy Bypass -Scope Process -Force; `

```bash|{type: 'command', platform:'win32', shell: 'powershell', privileged: true}
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
```


