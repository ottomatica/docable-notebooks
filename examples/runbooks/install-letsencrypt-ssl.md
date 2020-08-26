<!--
setup:
    ssh: 
        host: user@ip
        privateKey: ~/.ssh/id_rsa
-->

# Install Let's encrypt SSL for a nginx webserver



Download certbot:

```bash|{type: 'command'}
wget https://dl.eff.org/certbot-auto
```

Give execution permission to certbot script:
  
```bash|{type:'command'}
chmod a+x certbot-auto
```

Fetch your certificates using certbot:

```bash|{type: 'command', user: 'root', variables: 'YOUR_WEBSITE_HERE'}
./certbot-auto --debug -v certonly --nginx -d {{YOUR_WEBSITE_HERE}}
```

---

This certificate usually expires in 90 days, so you will need to renew it once in awhile. 

To do this first you should stop nginx:

```bash|{type: 'command'}
sudo systemctl stop nginx
```

Renew the certificate using certbot:

```bash|{type: 'command'}
./certbot-auto renew
```

And the re-start nginx:

```bash|{type: 'command'}
sudo systemctl start nginx
```

Now your certificate should be valid for another 90 days!

---

> [1] _https://certbot.eff.org/lets-encrypt/ubuntuxenial-nginx.html_  
> [2] _https://certbot.eff.org/docs/install.html#certbot-auto_
