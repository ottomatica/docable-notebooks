# Deploy Ottomatica Services (Ubuntu)

You will need to make sure you have ottomatica's environment and key added in [environments](/targets).

Verify connection.

```bash|{type: 'command'}
hostname
whoami
```

## Basic Server Setup

Update the `apt` package index:

```bash|{type: 'command', failed_when: 'exitCode!=0'}
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

Install `pm2`:
```bash|{type: 'command', failed_when: 'exitCode!=0'}
npm install pm2 -g
```

## Install Mongodb

Install key.

```bash|{type: 'command'}
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
```

List.

```bash|{type: 'command'}
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
```

Reload.

```bash|{type: 'command'}
sudo apt-get update
```

Install.

```bash|{type: 'command'}
sudo apt-get install -y mongodb-org
```

Start service.
```bash|{type: 'command'}
sudo systemctl start mongod
```


## Clone Services and Prepare Run Directory

Clone Docable Notebooks repository:

```bash|{type: 'command', variables: 'gh_user,gh_pass', failed_when:'exitCode!=0'}
git clone https://{{gh_user}}:{{gh_pass}}@github.com/ottomatica/ottomatica.services.git
```

Prepare directory.

```bash|{type: 'command'}
mkdir -p /srv/services/builds
```

For cleanup:

```bash|{type: 'command'}
ls -l
```

```bash|{type: 'command'}
rm -rf ~/ottomatica.services
```

## Setup sendgrid token

```bash|{type: 'file', path: '/etc/environment', variables: 'SENDGRID_TOKEN'}
SENDGRID_TOKEN={{SENDGRID_TOKEN}}
```

Confirm (will be masked in output cell).
```bash|{type: 'command'}
cat /etc/environment
```


## Deployment latest

Pull latest.

```bash|{type: 'command', failed_when:'exitCode!=0'}
cd ottomatica.services
git pull
```

Checkout latest into staging directory.

```bash|{type: 'command'}
cd ottomatica.services
BUILD=$(date -d "today" +"%Y%m%d-%H%M")
mkdir -p /srv/services/builds/$BUILD
git --work-tree=/srv/services/builds/$BUILD checkout -f 
rm -f /srv/services/staging
ln -s /srv/services/builds/$BUILD /srv/services/staging 
```

Examine builds.
```bash|{type: 'command'}
cd /srv/services/
ls -R
```

#### Registration service 

Install npm dependencies for registration service.

```bash|{type: 'command', failed_when: 'exitCode!=0'}
cd /srv/services/staging/registration
npm install
```

Switch over prod link.
```bash|{type: 'command'}
cd /srv/services/
rm -f current
ln -s $(readlink -f staging) current
```

Examine.
```bash|{type: 'command'}
ls -l /srv/services/
```

Start service.
```bash|{type: 'command'}
cd /srv/services/current/registration
npm run deploy
```

List services running.
```bash|{type: 'command'}
pm2 list
```

Stop registration service.
```bash|{type: 'command'}
pm2 stop index
```

```bash|{type: 'command'}
tail ~/.pm2/logs/index-error.log -n 200
```
