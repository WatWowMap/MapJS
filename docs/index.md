# Welcome to MapJS

NodeJS Map clone replacement for [RealDeviceMap](https://github.com/realdevicemap/realdevicemap)  

### Features  
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
- Configurable Quick Start Pokemon filter button for new users  
- Quickly filter Pokemon by generation/rarity/event  
- Legendary and normal raid buttons  
- Follow my location  
- Cache previous location  
- Global search for quest rewards, nest pokemon, gyms, and pokestops  
- Minimum candy and stardust amount quest filter  
- Zoom zoom zoom, fast  
- Much more...

### Getting Started
1. Clone repository `git clone https://github.com/versx/MapJS`  
1. Install dependencies `npm install`  
1. Copy config `cp src/configs/config.example.json src/configs/config.json`  
1. Create a Discord bot at https://discord.com/developers and enter the `botToken`, `clientId`, and `clientSecret` in your `config.json`  
1. Fill out config `vi src/configs/config.json`  
1. Create/copy a `static/custom/nests.json` file to show nests (geoJSON file format)  
1. Create/copy a `static/custom/areas.json` file to show scan areas (geoJSON file format, see below)  
1. Run `npm run create-locales`  
1. Run `npm start`  
1. Access via http://machineip:port/ login using your Discord account    