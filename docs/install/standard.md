# Standard Installation

!!! note
    **Prerequisites**:
    Existing [RDM](https://github.com/RealDeviceMap/RealDeviceMap) or [DataParser](https://github.com/versx/DataParser) style database

## Setup

1. Install nodejs v12
1. Install nginx
1. Install pm2

    ```sh
    npm i pm2 -g
    ```

1. Clone the repository

    ```sh
    git clone https://github.com/versx/MapJS
    ```

1. Install dependencies

    ```sh
    npm run update
    ```

1. Copy config

    ```sh
    cp src/configs/config.example.json src/configs/config.json
    ```

1. (Optional) Create a Discord bot at [https://discord.com/developers](https://discord.com/developers){target=_blank} and enter the `botToken`, `clientId`, and `clientSecret` in your `config.json`
1. Fill out config

    ```sh
    vi src/configs/config.json
    ```

1. Create/copy a `static/custom/nests.json` file to show nests (geoJSON file format)
1. Create/copy a `static/custom/areas.json` file to show scan areas (geoJSON file format, see below)
1. Run `npm run start` (see pm2 section for demonized run)
1. Access via [http://machineip:port/]() login using your Discord account

## Updating

1. Pull latest changes `git pull`
1. Run `npm update` in root folder
1. Run `npm start` or `pm2 restart MapJS`

## PM2

Once everything is setup and running appropriately, you can add this to PM2 `ecosystem.config.js` file so it is automatically started:

1. Create an `ecosystem.config.js` file, make sure to replace your `cwd` path.

    ```js
    module.exports = {
      apps : [{
        name: 'MapJS',
        script: 'index.js',
        cwd: '/home/username/MapJS/src/',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '2G',
        out_file: 'NULL'
      }]
    };
    ```

1. Start with `pm2 start ecosystem.config.js`

## Nginx example

Read a [nginx guide]() if you're unfamiliar with this web-service.
Use Nginx or Apache but **not** both.

```conf
#sudo vi /etc/nginx/conf.d/mapjs.conf
server {
        listen 80;
        server_name map.example.com;
        location / {
            proxy_set_header   X-Forwarded-For $remote_addr;
            proxy_set_header   Host $http_host;
            proxy_pass         http://127.0.0.1:8080;
        }
}
```

## Apache example

Read an [apache guide]() if you're unfamiliar with this web-service.
Use Nginx or Apache but **not** both.

```conf
#sudo vi /etc/apache2/sites-available/mapjs.conf
<VirtualHost *:80>
 ServerName map.example.com

 ProxyRequests On
 ProxyPass / http://127.0.0.1:8080
 ProxyPassReverse / http://127.0.0.1:8080
</VirtualHost>
```

[nginx guide]: https://www.digitalocean.com/community/questions/how-to-run-node-js-server-with-nginx
[apache guide]: https://tecadmin.net/apache-frontend-proxy-nodejs/
