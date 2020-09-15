
# Standard Install

Install node v12, nginx, etc.


## Updating

1. Pull latest changes `git pull`
1. Run `npm update` in root folder
1. Run `npm start` or `pm2 restart MapJS`

## Nginx example

```conf
server {
        listen 80;
        server_name map.domain.com;
        location / {
            proxy_set_header   X-Forwarded-For $remote_addr;
            proxy_set_header   Host $http_host;
            proxy_pass         http://127.0.0.1:8080;
        }
}
```
