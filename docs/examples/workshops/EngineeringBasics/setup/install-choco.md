[Setup](../Setup.md#setup) > Install choco

# Install Chocolately

Let's see if we already have `choco` installed?

```bash|{type: 'command', platform:'win32', failed_when:"!stdout.includes('Chocolatey v')"}
choco --V
```

### Checking your System's Execution Policy

Before we install `choco`, we are going to check your execution policy for your machine, which determines what scripts or software are allowed to run.

We are going to run the following command in the `powershell` shell, and check that your policy is not `Restricted` for your user.

```bash|{type: 'command', platform:'win32', shell: 'powershell', failed_when: "stdout.includes('Restricted')||exitCode==1"}
Get-ExecutionPolicy -List
```

If you are going to be running future commands or scripts, you definately want to fix this. Here are some options:

* `AllSigned`. Requires that all scripts and configuration files are signed by a trusted publisher, including scripts written on the local computer.
* `RemoteSigned`. Requires that all scripts and configuration files downloaded from the Internet are signed by a trusted publisher. The default execution policy for Windows server computers.
* `ByPass`. Nothing is blocked and there are no warnings or prompts. You can use this to _temporarily_ skip security checks: `Set-ExecutionPolicy Bypass -Scope Process`.

We recommend running one of the following: 

```bash|{type: 'command', platform:'win32', shell: 'powershell', privileged: true}
Set-ExecutionPolicy AllSigned -Scope CurrentUser
```

```bash|{type: 'command', platform:'win32', shell: 'powershell', privileged: true}
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Ready to Install

We're ready to run the following command in a powershell shell. This will download a powershell script from https://chocolatey.org, and run it.

```bash|{type: 'command', platform:'win32', shell: 'powershell', privileged: true}
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
```

We should now be able to run `choco`!

```bash|{type: 'command', platform:'win32', failed_when:"!stdout.includes('Chocolatey v')"}
choco --V
```

[Next: Package Managers](package-managers.md)