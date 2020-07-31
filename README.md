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

## Convert INI geofence format to GeoJSON format (for areas.json file to show scan areas)  
1.) Create `geofences` directory in root of project (with src folder)  
2.) Copy your `.txt` INI format geofence files to the `geofences` folder  
3.) Run `npm run convert -- ./geofences/` which will convert your INI geofences to one `areas.json` GeoJSON format file in the root of the project  
4.) Copy `areas.json` to `static/custom/areas.json` to show the scan areas on the map  

## PM2 (recommended)
Once everything is setup and running appropriately, you can add this to PM2 ecosystem.config.js file so it is automatically started:  
```
module.exports = {
  apps : [
  {
    name: 'MapJS',
    script: 'index.js',
    cwd: '/home/username/MapJS/src/',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    out_file: 'NULL'
  }
  ]
};
```

## TODO  
- Include S2Cell/Weather polgyons in api data
- Implement submission cells

## Credits  
[RealDeviceMap](https://github.com/realdevicemap/realdevicemap)  
