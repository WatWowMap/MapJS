# MapJS  

NodeJS Map clone replacement for [RealDeviceMap](https://github.com/realdevicemap/realdevicemap)  

## Installation
1.) Clone repository `git clone https://github.com/versx/MapJS`  
2.) Install dependencies `npm install`  
3.) Copy config `cp src/config.example.json src/config.json`  
4.) Create a Discord bot at https://discord.com/developers and enter the `botToken`, `clientId`, and `clientSecret` in your `config.json`  
5.) Fill out config `vi src/config.json`  
6.) Run `npm start`  
7.) Access via http://machineip:port/ login using your Discord account    

## Updating  
1.) `git pull`  
2.) Run `npm install` in root folder  
3.) Run `npm start`  

## PM2 (recommended)
Once everything is setup and running appropriately, you can add this to PM2 ecosystem.config.js file so it is automatically started:  
```
module.exports = {
  apps : [
  {
    name: 'RDM-opole2',
    script: 'index.js',
    cwd: '/home/username/RDM-opole2/src/',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    out_file: 'NULL'
  }
  ]
};
```

## Credits  
[RealDeviceMap](https://github.com/realdevicemap/realdevicemap)  