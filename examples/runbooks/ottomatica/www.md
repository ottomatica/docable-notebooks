# Deploy www site

You will need to make sure you have ottomatica's environment and key added in [environments](/targets).

Verify connection.

```bash|{type: 'command'}
hostname
whoami
```

### Setup and Configure nginx

Update cache.

```bash|{type: 'command', failed_when: 'exitCode!=0'}
sudo apt-get update
```

Install nginx.

```bash|{type: 'command', failed_when: 'exitCode!=0'}
sudo apt-get install -y nginx
```

Set nginx configuration. Remember to define `{{DOMAIN}}` variable.

```nginx|{type: 'file', path: '/etc/nginx/sites-available/default', variables: 'DOMAIN'}
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name www.{{DOMAIN}} {{DOMAIN}};

    # SSL configuration
    listen 443 ssl default_server;

    ssl_certificate /etc/letsencrypt/live/{{DOMAIN}}/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/{{DOMAIN}}/privkey.pem; # managed by Certbot

    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot

    # Redirect non-https traffic to https
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    # Note: You should disable gzip for SSL traffic.
    # See: https://bugs.debian.org/773332
    #
    root /var/www/html;

    # Add index.php to the list if you are using PHP
    index index.html index.htm;

    location / {
            # First attempt to serve request as file, then
            # as directory, then fall back to displaying a 404.
            try_files $uri $uri/ =404;
    }
}
```

Test configuration and reload nginx service.

```bash|{type: 'command', failed_when: 'exitCode!=0'}
nginx -t && nginx -s reload
```

## Deploy Site

```bash|{type: 'command', variables: 'gh_user,gh_pass', failed_when:'exitCode!=0'}
git clone https://{{gh_user}}:{{gh_pass}}@github.com/ottomatica/ottomatica.io.git
```

```bash|{type: 'command', failed_when:'exitCode!=0'}
cd ottomatica.io
git pull
```

Checkout latest into staging directory. Copy www to nginx serve directory

```bash|{type: 'command'}
cd ottomatica.io
mkdir -p /srv/
git --work-tree=/srv checkout -f 
cp -a /srv/www/. /var/www/html
```

```bash|{type: 'command'}
ls -l /var/www/html 
```