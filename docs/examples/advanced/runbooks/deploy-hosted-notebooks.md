


# Deploy Docable Notebooks (Ubuntu)

## Ensure Docker is installed

```bash|{type: 'command'}
whoami
```


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

Add Docker's GPG key:

```bash|{type: 'command', failed_when: 'exitCode!=0'}
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
```

Add Docker's stable repository:

```bash|{type: 'command'}
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
```

Update the `apt` package index after adding the repository in previous step:

```bash|{type: 'command'}
sudo apt-get update
```

Install latest version of Docker Engine and containerd:

```bash|{type: 'command', failed_when:'exitCode!=0'}
sudo apt-get install -y docker-ce docker-ce-cli containerd.io
```

Create `docker` group:

```bash|{type: 'command'}
sudo groupadd docker
```

Add your user to `docker` group:

```bash|{type: 'command'}
sudo usermod -aG docker $USER
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
git clone https://{{gh_user}}:{{gh_pass}}@github.com/ottomatica/docable-notebooks.git
```

Install npm dependencies:

```bash|{type: 'command', failed_when: 'exitCode!=0'}
cd docable-notebooks && npm install
```

Run with `prod` NODE_ENV and pm2:

```bash|{type: 'command'}
cd docable-notebooks && npm run prod
```
