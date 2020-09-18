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

Set nginx configuration.

```nginx|{type: 'file', path: '/etc/nginx/nginx.conf'}
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
        worker_connections 768;
        # multi_accept on;
}

http {

        ##
        # Basic Settings
        ##

        sendfile on;
        tcp_nopush on;
        tcp_nodelay on;
        keepalive_timeout 65;
        types_hash_max_size 2048;
        # server_tokens off;

        # server_names_hash_bucket_size 64;
        # server_name_in_redirect off;

        include /etc/nginx/mime.types;
        default_type application/octet-stream;

        ##
        # SSL Settings
        ##

        ssl_protocols TLSv1 TLSv1.1 TLSv1.2 TLSv1.3; # Dropping SSLv3, ref: POODLE
        ssl_prefer_server_ciphers on;

        ##
        # Logging Settings
        ##

        access_log /var/log/nginx/access.log;
        error_log /var/log/nginx/error.log;

        ##
        # Gzip Settings
        ##

        gzip on;

        # gzip_vary on;
        # gzip_proxied any;
        # gzip_comp_level 6;
        # gzip_buffers 16 8k;
        # gzip_http_version 1.1;
        # gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

        ## 
        # Api
        ## 
        ## node.js
        upstream app_services {
            server 127.0.0.1:3333;
        }

        ##
        # Virtual Host Configs
        ##

        include /etc/nginx/conf.d/*.conf;
        include /etc/nginx/sites-enabled/*;
}
```

Set site. Remember to define `{{DOMAIN}}` variable.

```nginx|{type: 'file', path: '/etc/nginx/sites-available/default', variables: 'DOMAIN'}

server {
    listen 80;
    return 301 https://$host$request_uri;
}

server {
    server_name services.{{DOMAIN}} www.{{DOMAIN}} {{DOMAIN}};

    # SSL configuration
    listen 443 ssl;

    ssl_certificate     /etc/letsencrypt/live/{{DOMAIN}}/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/{{DOMAIN}}/privkey.pem; # managed by Certbot

    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot

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

    location /api {

      proxy_set_header        Host $host;
      proxy_set_header        X-Real-IP $remote_addr;
      proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header        X-Forwarded-Proto $scheme;

      # Fix the “It appears that your reverse proxy set up is broken" error.
      proxy_pass          http://127.0.0.1:3333;
      proxy_read_timeout  90;

      proxy_redirect      http://127.0.0.1:3333 https://services.ottomatica.io;
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