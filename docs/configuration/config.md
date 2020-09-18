# Configuration

All server customization values are currently stored in your `src/configs/config.json` file. To get started please use the `config.example.json` file.

Anything you do not include will use the `default.json` as a fallback. When viewing the `default.json` file you will see additional settings that can be applied to your `config.json` in order to modify the values. **Please note** json files can not have code comments (`//`) as such we have provided notes on the configuration settings in the below snippet.

## root

```js
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
    // Maximum search results for global search to return
    "searchMaxResults": 20,
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
    // Google settings
    "google": {
        // Google analytics key
        "analytics": "",
        // Google Ad-Sense key
        "adsense": ""
    },
    // Custom icon repository locations
    // Scouting settings
    "scouting": {
        // Enable scouting
        "enabled": false,
        // GoFestController endpoint
        "url": "",
        // Maximum amount of scouts allowed
        "maxScouts": 15
    },
```

## map

```js
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
            "iv": { "value": 100, "color": "red" }, //min IV for glow
            "pvp": { "value": 1, "color": "blue" }, //min PVP for glow
            "both": { "color": "purple" } //color if a Pokemon meets IV & PVP requirements
        }
    },
```

## areas

```js
    // Areas list with location and zoom dropdown in navbar
    "areas": {
        "test": { "lat": 4.01, "lon": 117.01, "zoom": 15 },
        "cityA": { "lat": 4.01, "lon": 117.01, "zoom": 15 }
    },
```

## header

```js
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
```

## db

```js
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
```

## discord

This section is what allows sign in via Discord.

1. Create a Discord bot at [https://discord.com/developers](https://discord.com/developers){target=_blank}
1. Make sure to join this discord bot to your scanner server
1. Enter your the `botToken`, `clientId`, and `clientSecret` values from Discord into the below section
1. Add your `redirectUri` URL into the Discord Oauth section and update the value below. For testing locally you can use [http://localhost:8080/]() however for production systems we highly recommend a url secured via https.

Make sure all roles and discord identifiers (ids) are entered as strings IE - "9834983749834". Additionally you can use your discord server id, also known as your @everyone tag, in order to grant access to an entire server.

```js
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
    }
```

## tileservers

```js
    // Available tileservers
    "tileservers": {
        "Default": "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png;Map tiles by Carto, under CC BY 3.0. Data by  <a href='https://www.openstreetmap.org/'>OpenStreetMap</a>, under ODbL.",
        "OSM": "https://tile.openstreetmap.org/{z}/{x}/{y}.png;Map data Â© <a href='https://www.openstreetmap.org'>OpenStreetMap</a> contributors",
        "Dark Matter": "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png;Â© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors Â© <a href='https://carto.com/attributions'>CARTO</a>",
        "Alidade Smooth Dark": "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png;&copy; <a href='https://stadiamaps.com/'>Stadia Maps</a>, &copy; <a href='https://openmaptiles.org/'>OpenMapTiles</a> &copy; <a href='http://openstreetmap.org'>OpenStreetMap</a> contributors",
        "Thunder Forest": "https://{s}.tile.thunderforest.com/transport-dark/{z}/{x}/{y}.png;&copy; <a href='http://www.thunderforest.com/'>Thunderforest</a>, &copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
        "Satellite": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x};Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
    },
```

## icons

```js
    "icons": {
        // Default local icon repository
        "Default": {
            "path": "https://mygod.github.io/pokicons/v2"
        },
        "Local Example": {
            "path": "/img/pokemon"
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
```

## rarity


```js
  // These fields let you customize each of the preset filter buttons available in the Pokemon Filter menu.
   "rarity": {
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
                "value": "1-10",
                "enabled": false
            },
            "pvpOr": {
                "value": "1-5",
                "enabled": false
            }
        },
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
                553,554,555,556,559,560,561,564,565,566,567,570,574,575,576,587,596,597,599,600,601,607,608,609,610,611,612,618,622,623,626,631,632,633,634,635,636,637,638,639,640,641,642,643,644,645,646,647,648,649
            ]
        },
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
        "event": [
            172,173,174,175,182,186,192,196,197,199,208,212,225,230,233,236,238,239,240,290,291,292,298,303,321,327,334,350,352,359,360,367,368,403,404,405,406,
            407,416,424,429,430,433,438,439,440,442,446,447,448,458,461,462,463,464,465,466,467,468,469,470,471,472,473,474,475,476,477,478,479,532,533,534,559,
            560,599,600,601,627,628
        ]
    }
```
