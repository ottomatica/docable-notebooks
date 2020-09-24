
# Setup Docker and Docker-Machine on Windows

Check if you have choco!

```bash|{type:'command', failed_when: "!stdout.includes('Chocolatey v')"}
choco --V
```

See what you have installed already.

```bash|{type:'command'}
choco list --local-only
```

Install the docker command line tools.

```bash|{type:'command', privileged: true, failed_when: "!stderror.includes('The install of docker-cli was successful')"}
choco install docker-cli -y
```

Install service for hosting docker in local virtualization provider.

```bash|{type:'command', privileged: true, failed_when: "!stderror.includes('The install of docker-machine was successful')"}
choco install docker-machine -y
```

Create a virtual machine in virtualbox to host the docker engine and service.

```bash|{type:'command'}
docker-machine create --driver virtualbox default
```

### Setting up environment

If using Powershell, you can add the following to your `$profile`:
```
$dm = (docker-machine env default) | Out-String
Invoke-Expression $dm
```

If using Cmd shell, you can run the following, but it will only be valid for the current session.
```
@FOR /f "tokens=*" %i IN ('"C:\ProgramData\chocolatey\lib\docker-machine\bin\docker-machine.exe" env default') DO @%i
```

To make those settings stick, you need to run:

```bash|{type:'command', refresh: true}
SETX DOCKER_TLS_VERIFY 1
SETX DOCKER_HOST tcp://192.168.99.101:2376
SETX DOCKER_CERT_PATH %USERPROFILE%\.docker\machine\machines\default
SETX DOCKER_MACHINE_NAME default
SETX COMPOSE_CONVERT_WINDOWS_PATHS true
```

Because the variables may change slightly over time, you can get the exact command by running. Remember to replace `SET => SETX`. 

```bash|{type:'command'}
docker-machine env default
```

### Test your docker setup!

```bash|{type:'command'}
echo %DOCKER_HOST%
```

```bash|{type:'command'}
docker run hello-world
```

### Managing docker-machine

If restarting the Windows, you may need to run `docker-machine start` after reboot, to ensure virtual machine is running.


## Current Tutorial Issues:

* Streaming output would be good. Install commands are problematic and time out. 
  privileged commands would require a fix in `sudo-prompt` to expose or access the child process: https://github.com/jorangreef/sudo-prompt/blob/master/index.js
* Multiline commands are not working well---only first line gets executed. I had to change SETX command block to be oneliner
* The SETX command isn't ideal either since it has hard-coded path. This should be updated to be dynamic.
* Finally, reloading server and it's process to handle any change to env... tricky. The `echo %DOCKER_HOST%` command will not have the right environment variable, unless the docable notebook server and the shell it's running in, is restarted.