
Create a simple `nginx` configuration script, with the variable `{{DOMAIN}}`.

```nginx|{type: 'file', path: '/etc/nginx/sites-available/default', variables: 'DOMAIN'}
server {
    server_name www.{{DOMAIN}} {{DOMAIN}};
    listen 80;
    root /var/www/html;
    index index.html index.htm;
    location / {
            try_files $uri $uri/ =404;
    }
}
```