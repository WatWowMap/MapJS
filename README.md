# MapJS  

NodeJS Map clone replacement for [RealDeviceMap](https://github.com/realdevicemap/realdevicemap)  

## Features  
- Everything from RealDeviceMap UI Map  
- Discord authentication or no authentication  
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
4.) Copy rarity `cp src/rarity.example.json src/rarity.json`  
5.) Create a Discord bot at https://discord.com/developers and enter the `botToken`, `clientId`, and `clientSecret` in your `config.json`  
6.) Fill out config `vi src/config.json`  
7.) Create/copy a `static/custom/nests.json` file to show nests (geoJSON file format)  
8.) Create/copy a `static/custom/areas.json` file to show scan areas (geoJSON file format, see below)  
9.) Run `npm start`  
10.) Access via http://machineip:port/ login using your Discord account    

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
        "Default": {
            "path": "/img/",
            "raidOffsetY": 0.269,
            "questOffsetY": 0,
            "gymAnchorY": 0.849,
            "pokestopAnchorY": 0.896
        },
        "RemotePokemonExample": {
            "path": "https://example.com/pokemon_images",
            "pokemonList": ["001_163", "002_166", "002_166_shiny", "003_169", "003_169_female"],
            "raidOffsetY": 0.269,
            "questOffsetY": 0,
            "gymAnchorY": 0.849,
            "pokestopAnchorY": 0.896
        }
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
    // These fields let you customize each of the preset filter buttons available in the Pokemon Filter menu. 
}
```

## Rarity
```js
{
    //Set the default values for the filters that your users will see the first time they use the map or reset filters globally
   "Default": {
        "ivAnd": { 
            "value": "80-100",
            "enabled": false
        },
        "ivOr": { 
            "value": "95-100",
            "enabled": false
        },
        "pvpAnd": { 
            "value": "1-5",
            "enabled": false
        },
        "pvpOr": { 
            "value": "1-10",
            "enabled": false
        }
    },
    //Set the values that activate when a user selects the "Quick Start" button in the Pokemon Filter Menu
    "quickStart": {
        "ivAnd": { 
            "value": "90-100",
            "enabled": false
        },
        "ivOr": { 
            "value": "95-100",
            "enabled": true
        },
        "pvpAnd": { 
            "value": "1-5",
            "enabled": false
        },
        "pvpOr": { 
            "value": "1-3",
            "enabled": false
        },
        "pokemon": [
            3,6,9,65,68,76,94,99,106,107,108,112,113,114,115,122,125,130,131,134,135,136,137,142,143,144,145,146,147,148,149,150,151,154,157,160,169,176,196,197,201,
            214,221,222,233,237,241,242,243,244,245,246,247,248,249,250,251,254,257,260,280,281,282,286,287,288,289,290,291,292,297,303,306,327,328,329,330,349,350,
            357,358,359,361,362,365,366,369,371,372,373,374,375,376,377,378,379,380,381,382,383,384,385,386,389,392,395,403,404,405,408,409,410,411,417,443,444,445,
            447,448,480,481,482,483,484,485,486,487,488,489,490,491,492,493,494,496,497,499,500,502,503,522,523,524,525,526,530,531,532,533,534,538,539,550,551,552,
            553,554,555,556,559,560,561,564,565,566,567,570,574,575,576,587,596,597,599,600,601,607,608,609,610,611,612,618,622,623,626,631,632,633,634,635,636,637,
	    638,639,640,641,642,643,644,645,646,647,648,649
        ]
    },
    //Enable/Disables the following Pokemon when a user selects "Common" in the Pokemon Filter Menu.
    "common": [
        1,4,7,10,13,16,19,21,23,25,27,29,32,35,37,39,41,43,46,48,50,52,54,56,58,60,63,66,69,72,74,77,79,81,83,84,86,88,90,92,95,96,98,100,102,104,109,111,
        115,116,118,120,122,123,128,129,133,138,140,152,155,158,161,163,165,167,170,177,179,183,187,190,191,193,194,198,200,204,207,209,214,215,216,218,220,
        223,228,231,252,255,258,261,263,265,270,273,276,278,280,283,285,287,293,296,299,300,304,307,309,311,312,313,314,315,316,318,320,322,325,328,331,333,
        339,341,343,345,347,349,351,353,355,361,363,366,370,387,390,393,396,399,401,412,415,418,420,421,422,425,427,431,434,436,449,451,453,456,459,495,498,
        501,504,506,509,511,513,515,517,519,527,529,535,540,543,546,548,551,557,562,568,570,572,577,580,582,585,588,590,592,602,605,613,616,619,624,629
    ],
    "uncommon": [
        2,5,8,11,14,17,20,22,24,26,30,33,36,38,40,42,44,47,49,51,53,55,57,59,61,64,67,70,73,75,78,80,82,85,87,89,91,93,97,99,101,103,105,110,112,117,119,121,
        124,125,126,127,139,141,153,156,159,162,164,166,168,171,178,180,184,185,188,195,202,203,205,206,210,211,213,217,219,221,222,224,226,227,229,234,253,
        256,259,262,264,266,268,271,274,277,279,281,284,286,288,294,297,301,302,305,308,310,317,319,323,326,329,332,335,336,337,338,340,342,344,346,348,354,
        356,362,364,388,391,394,397,400,402,419,423,426,428,432,435,437,441,450,452,454,455,457,460,496,499,502,505,507,510,520,522,524,528,536,541,544,547,
        549,550,552,558,563,569,573,578,581,583,586,587,591,595,603,606,614,615,620
    ],
    "rare": [
        3,6,9,12,15,18,28,31,34,45,62,65,68,71,76,94,106,107,108,113,114,130,131,132,134,135,136,137,142,143,144,147,148,149,154,157,160,169,172,173,174,175,
        176,181,182,186,189,192,196,197,199,201,208,212,225,230,232,233,235,236,237,238,239,240,241,242,246,247,248,254,257,260,267,269,272,275,282,289,290,
        291,292,295,298,303,306,321,324,327,330,334,350,352,357,358,359,360,365,367,368,369,371,372,373,374,375,376,389,392,395,398,403,404,405,406,407,408,
        409,410,411,413,414,416,417,424,429,430,433,438,439,440,442,443,444,445,446,447,448,458,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,
        476,477,478,479,497,500,503,508,512,514,516,518,521,523,525,526,530,531,532,533,534,537,538,539,542,545,553,554,555,556,559,560,561,564,565,566,567,
        571,574,575,576,579,584,589,593,594,596,597,598,599,600,601,604,607,608,609,610,611,612,617,618,621,622,623,625,626,627,628,630,631,632,633,634,635,
        636,637
    ],
    "ultraRare": [
        147,148,149,201,246,247,248,371,372,373,374,375,376,443,444,445,480,481,482,607,608,609,610,611,612,633,634,635
    ],
    "regional": [
        83,115,122,128,214,222,313,314,324,335,336,337,338,357,369,417,422,423,441,455,480,481,482,511,512,513,514,515,516,538,539,550,556,561,626,631,632
    ],
    //By default set to Pokemon that don't normally spawn in the wild. Can be used to easily toggle Event pokemon on/off if updated during each event
    "event": [
        172,173,174,175,182,186,192,196,197,199,208,212,225,230,233,236,238,239,240,290,291,292,298,303,321,327,334,350,352,359,360,367,368,403,404,405,406,
        407,416,424,429,430,433,438,439,440,442,446,447,448,458,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,532,533,534,559,
        560,599,600,601,627,628
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
