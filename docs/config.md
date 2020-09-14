# Configuration  

Your `config.json` file is only required for a few options. Anything you do not include will use the `default.json` as a fallback. When viewing the `default.json` file you will see additional settings that can be applied to your `config.json` in order to modify the values. **Please note** json files can not have code comments (`//`) as such we have provided notes on the configuration settings in the below snippet.

```js
{
    // Listening interface IP address
    "interface": "0.0.0.0",
    // Listening port
    "port": 8080,
    // Map title shown in navigation bar
    "title": "MapJS",
    // Web page title (shown in tab)
    "headerTitle": "MapJS - NodeJS Map Replacement",
    // Localization to use for the map
    "locale": "en",
    // Theme style (dark/light)
    "style": "dark",
    // Cookie session secret key, make sure to randomize and NOT use default
    // either keyboard mash or a generator https://browserling.com/tools/random-hex
    "sessionSecret": "98ki^e72~!@#(85o3kXLI*#c9wu5l!Z",
    // API rate limiting
    "ratelimit": {
        // Amount of cooldown time period if rate limit is reached (minutes)
        "time": 60,
        // Maximum number of API requests that can be made within a minute
        "requests": 100
    },
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
        // Defines the color of 70m paths and Quest/IV Polygons
        "devicePathColor": "red",
        // Clustering settings
        "clusters": {
            // Enable pokemon clustering
            "pokemon": true,
            // Enable gym clustering
            "gyms": true,
            // Enable pokestop clustering
            "pokestops": true,
            // Zoom level when clustering starts/stops
            "zoomLevel": 13
        },
        // Default filter settings for new users/cleared cache
        "filters": {
            // Show gyms
            "gyms": true,
            // Show raids
            "raids": false,
            // Show raid timers
            "raidTimers": false,
            // Show pokestops
            "pokestops": false,
            // Show quests
            "quests": false,
            // Show invasions
            "invasions": false,
            // Show invasion timers
            "invasionTimers": false,
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
    // Areas list with location and zoom dropdown in navbar
    "areas": {
        "test": { "lat": 4.01, "lon": 117.01, "zoom": 15 }
    },
    // Custom navigation headers
    "header": {
        // Left side navigation headers (leave empty `[]` if not needed)
        "left": [
            { "name": "Stats", "url": "https://stats.example.com", "icon": "fas fa-chart-bar" }
        ],
        // Right side navigation headers (leave empty `[]` if not needed)
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
        // Required guilds in order to authenticate successfully (i.e. ["9834983749834", "9834983743", etc])
        // leave empty `[]` for no guild requirement although not recommended.
        "guilds": [],
        // Map permissions
        "perms": {
            // View map permissions
            "map": {
                // Enable map (probably redundant)
                "enabled": true,
                // Discord roles required in order to view map (leave empty `[]` for no role requirement)
                // (i.e ["803948098", "983409830", etc]
                "roles": []
            },
            // View Pokemon permissions
            "pokemon": {
                // Enable Pokemon
                "enabled": true,
                // Discord roles required in order to view Pokemon (leave empty `[]` for no role requirement)
                // (i.e ["803948098", "983409830", etc]
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
            "scanAreas": {
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
            "path": "/img/pokemon"
        },
        "POGO": {
            "path": "https://mygod.github.io/pokicons/v2"
        },
        // Remote icon repository
        "RemotePokemonExample": {
            "path": "https://example.com/pokemon_images",
            // For repo without index.json support, since we can't traverse a remote directory easily,
            // you'll need to provide a list of available forms, shiny, or gender icons so the map is
            // aware of available icons that way invalid icons are not shown.
            "pokemonList": ["001_00", "002_00", "002_00_shiny", "003_00", "003_00_female", "003_950"]
            // expected format is <xxx pokemon id>(_00|_<form id>|_v<temp evolution id>)[_female][_<xx costume id>][_shiny]
            // automatic fallback is in place, so the bare minimum you need to provide is "xxx_00" for each pokemon
            // and "000" for new pokemon fallback (000 does not need to appear in pokemonList)
            // Reference: Asset icon processing tool: https://github.com/Mygod/pokemon-icon-postprocessor
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