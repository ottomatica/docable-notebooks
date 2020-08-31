# Deploy Ottomatica Services (Ubuntu)

You will need to make sure you have ottomatica's environment and key added in [environments](/targets).

Verify connection.

```bash|{type: 'command'}
hostname
whoami
```

## Basic Server Setup

Update the `apt` package index:

```bash|{type: 'command'}
sudo apt update
```

Installing dependencies needed to use repository over HTTPS:

```bash|{type: 'command'}
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg-agent \
    software-properties-common
```

## Ensure Node.js is installed on the server

Add nodesource repository:

```bash|{type: 'command', failed_when: 'exitCode!=0'}
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
```

Install Node.JS v12.x:

```bash|{type: 'command', failed_when: 'exitCode!=0'}
sudo apt-get install -y nodejs
```

## Clone Docable Notebooks, Install, and Run

Clone Docable Notebooks repository:

```bash|{type: 'command', variables: 'gh_user,gh_pass', failed_when:'exitCode!=0'}
git clone https://{{gh_user}}:{{gh_pass}}@github.com/ottomatica/ottomatica.services.git
```

If already cloned, you can also pull latest changes. `TODO`.


Install npm dependencies:

```bash|{type: 'command', failed_when: 'exitCode!=0'}
cd ottomatica.services && npm install
```