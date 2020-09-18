
# Install Let's encrypt SSL for a nginx webserver



Download certbot:

```bash|{type: 'command'}
wget https://dl.eff.org/certbot-auto --show-progress --progress=bar:force 2>&1
```

Give execution permission to certbot script:
  
```bash|{type:'command'}
chmod a+x certbot-auto
```

Install dependencies:

```bash|{type: 'command', user: 'root', variables: 'YOUR_WEBSITE_HERE'}
apt-get install python3-venv -y
```

Fetch your certificates using certbot:

```bash|{type: 'command', user: 'root', variables: 'YOUR_WEBSITE_HERE'}
USE_PYTHON_3=1 ./certbot-auto --debug -v certonly --nginx -d {{YOUR_WEBSITE_HERE}} --no-bootstrap
```

Note, currently, we need to specify `USE_PYTHON_3=1` so that we use python3 on our system, and `--no-bootstrap`, so certbot-auto doesn't try to install python2 version of dependencies.

`TODO`: Current need to specific a prompt response to this:

> Enter email address (used for urgent renewal and security notices)
> (Enter 'c' to cancel):

Also this:

> (A)gree/(C)ancel:

And:

> (Y)es/(N)o:

-----

### Renewing your certificate

This certificate usually expires in 90 days, so you will need to renew it once in awhile. 

Renew the certificate using certbot:

```bash|{type: 'command'}
./certbot-auto renew
```

And then re-start nginx:

```bash|{type: 'command'}
nginx -t && nginx -s reload
```

Now your certificate should be valid for another 90 days!

---

> [1] _https://certbot.eff.org/lets-encrypt/ubuntuxenial-nginx.html_  
> [2] _https://certbot.eff.org/docs/install.html#certbot-auto_
