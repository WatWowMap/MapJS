# MapJS  

NodeJS Map clone replacement for [RealDeviceMap](https://github.com/realdevicemap/realdevicemap)  

## Features  
- Everything from RealDeviceMap UI Map  
- Pokemon form filtering  
- Raid Pokemon form filtering  
- Nests and nest filtering  
- Pokemon glow based on minimum IV  
- Refactored Global IV/Pokemon/Pokestop/Raid filtering  
- PVP rank filtering  
- Invasion type filtering  
- Weather type filtering  
- Device status filtering
- Big karp and tiny rat filtering  
- Custom icon support  
- 400k+ less icons  
- Pokemon clustering  
- Mobile friendly filters  
- Available raid boss and quest rewards from database for smaller filter lists
- Scan area polygons  
- Disable trash pokemon button  
- Legendary and normal raid buttons  
- Follow my location  
- Cache previous location  
- Global search for quest rewards, nest pokemon, gyms, and pokestops
- Minimum candy and stardust amount quest filter
- Quick Start Pokemon filter button for new users
- Fast  

## Installation
1.) Clone repository `git clone https://github.com/versx/MapJS`  
2.) Install dependencies `npm install`  
3.) Copy config `cp src/config.example.json src/config.json`  
4.) Create a Discord bot at https://discord.com/developers and enter the `botToken`, `clientId`, and `clientSecret` in your `config.json`  
5.) Fill out config `vi src/config.json`  
6.) Create/copy a `static/custom/nests.json` file to show nests (geoJSON file format)  
7.) Create/copy a `static/custom/areas.json` file to show scan areas (geoJSON file format, see below)  
8.) Run `npm start`  
9.) Access via http://machineip:port/ login using your Discord account    

## Configuration  
```js
{
    // Listening interface IP address
    "interface": "0.0.0.0",
    // Listening port
    "port": 8080,
    // Map title
    "title": "MapJS",
    // Localization
    "locale": "en",
    // Theme style
    "style": "dark",
    // Map settings
    "map": {
        // Maximum available Pokemon
        "maxPokemonId": 649,
        // Map start location latitude
        "startLat": 0,
        // Map start location longitude
        "startLon": 0,
        // Map start zoom
        "startZoom": 12,
        // Map minimum zoom level
        "minZoom": 10,
        // Map maximum zoom level
        "maxZoom": 18,
        // Clustering settings
        "clusters": {
            // Enable pokemon clustering
            "pokemon": true
        },
        // Default filter settings for new users/cleared cache
        "filters": {
            // Show gyms
            "gyms": true,
            // Show raids
            "raids": false,
            // Show pokestops
            "pokestops": false,
            // Show quests
            "quests": false,
            // Show invasions
            "invasions": false,
            // Show spawnpoints
            "spawnpoints": false,
            // Show Pokemon
            "pokemon": false,
            // Show nests
            "nests": false,
            // Show S2 scan cells
            "scanCells": false,
            // Show S2 submission cells
            "submissionCells": false,
            // Show weather cells
            "weather": false,
            // Show scan area polygons
            "scanAreas": false,
            // Show active devices
            "devices": false
        },
        // Pokemon glow settings
        "glow": {
            // Minimum IV to add glow effect
            "iv": 100,
            // Glow color
            "color": "red"
        }
    },
    // Areas list with location and zoom for dropdwon
    "areas": {
        "test": { "lat": 4.01, "lon": 117.01, "zoom": 15 }
    },
    // Custom navigation headers
    "header": {
        // Left side navigation headers
        "left": [
            { "name": "Stats", "url": "https://stats.example.com", "icon": "fas fa-chart-bar" }
        ],
        // Right side navigation headers
        "right": [
            { "name": "Discord", "url": "https://discord.com/invite/example", "icon": "fab fa-discord" }
        ]
    },
    // Available tileservers
    "tileservers": {
        "Default": "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png;Map tiles by Carto, under CC BY 3.0. Data by  <a href='https://www.openstreetmap.org/'>OpenStreetMap</a>, under ODbL.",
        "OSM": "https://tile.openstreetmap.org/{z}/{x}/{y}.png;Map data Â© <a href='https://www.openstreetmap.org'>OpenStreetMap</a> contributors",
        "Dark Matter": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png;Â© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors Â© <a href='https://carto.com/attributions'>CARTO</a>",
        "Alidade Smooth Dark": "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png;&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a>, &copy; <a href='https://openmaptiles.org/'>OpenMapTiles</a> &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors",
        "Thunder Forest": "https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png;&copy; <a href='http://www.thunderforest.com/'>Thunderforest</a>, &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
        "Satellite": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x};Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    },
    // Database settings
    "db": {
        // RealDeviceMap scanner database settings
        "scanner": {
            "host": "127.0.0.1",
            "port": 3306,
            "username": "user",
            "password": "pass123!",
            "database": "rdmdb",
            "charset": "utf8mb4"
        },
        // PMSF nest script database settings
        "manualdb": {
            "host": "127.0.0.1",
            "port": 3306,
            "username": "user",
            "password": "pass123!",
            "database": "manualdb",
            "charset": "utf8mb4"
        }
    },
    // Discord authentication settings
    "discord": {
        // Enable discord authentication
        "enabled": true,
        // Channel ID for logging
        "logChannelId": "",
        // Status display message for the bot
        "status": "Map Status: Online",
        // Discord bot token
        "botToken": "",
        // Discord bot client id
        "clientId": "",
        // Discord bot client secret
        "clientSecret": "",
        // Discord bot redirect uri
        "redirectUri": "http://localhost:8080/api/discord/callback",
        // Required guilds in order to authenticate successfully
        "guilds": [],
        // Map permissions
        "perms": {
            // View map permissions
            "map": {
                // Enable map (probably redundant)
                "enabled": true,
                // Discord roles required in order to view map (leave empty `[]` for no role requirement)
                "roles": []
            },
            // View Pokemon permissions
            "pokemon": {
                // Enable Pokemon
                "enabled": true,
                // Discord roles required in order to view Pokemon (leave empty `[]` for no role requirement)
                "roles": []
            },
            "raids": {
                "enabled": true,
                "roles": []
            },
            "gyms": {
                "enabled": true,
                "roles": []
            },
            "pokestops": {
                "enabled": true,
                "roles": []
            },
            "quests": {
                "enabled": true,
                "roles": []
            },
            "lures": {
                "enabled": true,
                "roles": []
            },
            "invasions": {
                "enabled": true,
                "roles": []
            },
            "spawnpoints": {
                "enabled": true,
                "roles": []
            },
            "iv": {
                "enabled": true,
                "roles": []
            },
            "pvp": {
            	"enabled": true,
            	"roles": []
            },
            "s2cells": {
                "enabled": true,
                "roles": []
            },
            "submissionCells": {
                "enabled": true,
                "roles": []
            },
            "nests": {
                "enabled": true,
                "roles": []
            },
            "weather": {
                "enabled": true,
                "roles": []
            },
            "devices": {
                "enabled": true,
                "roles": []
            }
        }
    },
    // Google settings
    "google": {
        // Google analytics key
        "analytics": "",
        // Google Ad-Sense key
        "adsense": ""
    },
    // Custom icon repository locations
    "icons": {
        // Default local icon repository
        "Default": "/img/"
    },
    // Scouting settings
    "scouting": {
        // Enable scouting
        "enabled": false,
        // GoFestController endpoint
        "url": "",
        // Maximum amount of scouts allowed
        "maxScouts": 15
    },
    // Maximum search results for global search to return
    "searchMaxResults": 20,
    // Set a custom list of Pokemon to be activated if a user selects the "Quick Start" filter button on the Pokemon Filter menu
    "recommendedPokemon": [
        3,6,9,65,68,76,94,99,106,107,108,112,113,114,115,122,125,130,131,134,135,136,137,142,143,144,145,146,147,148,149,150,151,154,157,160,169,176,196,197,201,
        214,221,222,233,237,241,242,243,244,245,246,247,248,249,250,251,254,257,260,280,281,282,286,287,288,289,290,291,292,297,303,306,327,328,329,330,349,350,357,
        358,359,361,362,365,366,369,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,389,392,395,403,404,405,408,409,410,411,417,443,444,445,447,448,
        480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,496,497,499,500,502,503,522,523,524,525,526,530,531,532,533,534,538,539,550,551,552,553,554,555,
        556,559,560,561,564,565,566,567,570,574,575,576,587,596,597,599,600,601,607,608,609,610,611,612,618,622,623,626,631,632,633,634,635,636,637,638,639,640,
        641,642,643,644,645,646,647,648,649
    ]
    
}
```

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

## TODO  
- Finish custom user settings modal (user defined glow settings, cluster settings, etc)  
- Notifications  
- Notification sounds  
- Bouncing marker options  
- Heatmaps  
- Basic statistics  
- Separate cluster layers by type
- Possibly change filter selection from a list to a grid
- Force logout of other devices if logged into multiple
- Glow for top pvp ranks
- Only clear layers if filter changed
- Icon spacing
- Search quest by task name
- Filter by Pokemon type for Pokemon/raids/quests?

## Credits  
- [RealDeviceMap](https://github.com/realdevicemap/realdevicemap)  
- [PMSF](https://github.com/pmsf/pmsf)  
