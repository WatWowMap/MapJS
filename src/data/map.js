'use strict';

const i18n = require('i18n');

const InventoryItemId = require('./item.js');
const config = require('../config.json');
const query = require('../services/db.js');

async function getData(req, res, filter) {
    //console.log('Filter:', filter);
    const minLat = filter.min_lat;
    const maxLat = filter.max_lat;
    const minLon = filter.min_lon;
    const maxLon = filter.max_lon;
    const showGyms = filter.show_gyms || false;
    const showRaids = filter.show_raids || false;
    const showPokestops = filter.show_pokestops || false;
    const showQuests = filter.show_quests || false;
    const questFilterExclude = filter.quest_filter_exclude ? JSON.parse(filter.quest_filter_exclude || {}) : []; //string 
    const showPokemon = filter.show_pokemon || false;
    const pokemonFilterExclude = filter.pokemon_filter_exclude ? JSON.parse(filter.pokemon_filter_exclude || {}) : []; //int JSON.parse(
    const pokemonFilterIV = filter.pokemon_filter_iv ? JSON.parse(filter.pokemon_filter_iv || {}) : []; //dictionary JSON.parse(
    const raidFilterExclude = filter.raid_filter_exclude ? JSON.parse(filter.raid_filter_exclude || {}) : []; //JSON.parse(
    const gymFilterExclude = filter.gym_filter_exclude ? JSON.parse(filter.gym_filter_exclude || {}) : []; // JSON.parse(
    const pokestopFilterExclude = filter.pokestop_filter_exclude ? JSON.parse(filter.pokestop_filter_exclude || {}) : []; //JSON.parse(
    const spawnpointFilterExclude = filter.spawnpoint_filter_exclude ? JSON.parse(filter.spawnpoint_filter_exclude || {}) : []; //JSON.parse(
    const showSpawnpoints = filter.show_spawnpoints || false;
    const showCells = filter.show_cells || false;
    const showSubmissionPlacementCells = filter.show_submission_placement_cells || false;
    const showSubmissionTypeCells = filter.show_submission_type_cells || false;
    const showWeather = filter.show_weather || false;
    const showActiveDevices = filter.show_active_devices || false;
    const showPokemonFilter = filter.show_pokemon_filter || false;
    const showQuestFilter = filter.show_quest_filter || false;
    const showRaidFilter = filter.show_raid_filter || false;
    const showGymFilter = filter.show_gym_filter || false;
    const showPokestopFilter = filter.show_pokestop_filter || false;
    const showSpawnpointFilter = filter.show_spawnpoint_filter || false;
    const lastUpdate = filter.last_update || 0;
    if ((showGyms || showRaids || showPokestops || showPokemon || showSpawnpoints ||
        showCells || showSubmissionTypeCells || showSubmissionPlacementCells || showWeather) &&
        (minLat === null || maxLat === null || minLon === null || maxLon === null)) {
        //res.respondWithError(BadRequest);
        return;
    }

    // TOOD: get perms via req
    const permViewMap = true;
    const permShowLures = true;
    const permShowInvasions = true;
    const permShowIV = true;

    let data = {};
    if (showGyms || showRaids) {
        data['gyms'] = await getGyms(minLat, maxLat, minLon, maxLon, lastUpdate, !showGyms, showRaids, raidFilterExclude, gymFilterExclude);
    }
    if (showPokestops || showQuests) {
        data['pokestops'] = await getPokestops(minLat, maxLat, minLon, maxLon, lastUpdate, !showPokestops && showQuests, showQuests, permShowLures, permShowInvasions, questFilterExclude, pokestopFilterExclude);
    }
    if (showPokemon) {
        data['pokemon'] = await getPokemon(minLat, maxLat, minLon, maxLon, permShowIV, lastUpdate, pokemonFilterExclude, pokemonFilterIV);
    }
    if (showSpawnpoints) {
        data['spawnpoints'] = await getSpawnpoints(minLat, maxLat, minLon, maxLon, lastUpdate, spawnpointFilterExclude);
    }
    if (showActiveDevices) {
        data['active_devices'] = await getDevices();
    }
    if (showCells) {
        data['cells'] = await getS2Cells(minLat, maxLat, minLon, maxLon, lastUpdate);
    }
    if (showSubmissionPlacementCells) {
        data['submission_placement_cells'] = [];//result?.cells
        data['submission_placement_rings'] = [];//result?.rings
    }
    if (showSubmissionTypeCells) {
        data['submission_type_cells'] = [];
    }
    if (showWeather) {
        data['weather'] = await getWeather(minLat, maxLat, minLon, maxLon, lastUpdate);
    }

    if (permViewMap && showPokemonFilter) {
        const onString = i18n.__('filter_on');
        const offString = i18n.__('filter_off');
        const ivString = i18n.__('filter_iv');
    
        const pokemonTypeString = i18n.__('filter_pokemon');
        const generalTypeString = i18n.__('filter_general');
    
        const globalIV = i18n.__('filter_global_iv');
        const configureString = i18n.__('filter_configure');
        const andString = i18n.__('filter_and');
        const orString = i18n.__('filter_or');
    
        let pokemonData = [];

        if (permShowIV) {
            for (let i = 0; i <= 1; i++) {
                const id = i === 0 ? 'and' : 'or';
                const filter = `
                <div class="btn-group btn-group-toggle" data-toggle="buttons">
                    <label class="btn btn-sm btn-off select-button-new" data-id="${id}" data-type="pokemon-iv" data-info="off">
                        <input type="radio" name="options" id="hide" autocomplete="off">${offString}
                    </label>
                    <label class="btn btn-sm btn-on select-button-new" data-id="${id}" data-type="pokemon-iv" data-info="on">
                        <input type="radio" name="options" id="show" autocomplete="off">${onString}
                    </label>
                </div>
                `;
                const andOrString = i === 0 ? andString : orString;
                const size = `<button class="btn btn-sm btn-primary configure-button-new" "data-id="${id}" data-type="pokemon-iv" data-info="global-iv">${configureString}</button>`;
                pokemonData.push({
                    'id': {
                        'formatted': andOrString,
                        'sort': i
                    },
                    'name': globalIV,
                    'image': '-',
                    'filter': filter,
                    'size': size,
                    'type': generalTypeString
                });
            }
        }

        for (let i = 1; i <= config.map.maxPokemonId; i++) {
            let ivLabel = '';
            if (permShowIV) {
                ivLabel = `
                <label class="btn btn-sm btn-size select-button-new" data-id="${i}" data-type="pokemon" data-info="iv">
                    <input type="radio" name="options" id="iv" autocomplete="off">${ivString}
                </label>
                `;
            } else {
                ivLabel = '';
            }
            const filter = generateShowHideButtons(i, 'pokemon', ivLabel);
            const size = generateSizeButtons(i, 'pokemon');
            pokemonData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i + 1
                },
                'name': i18n.__('poke_' + i),
                'image': `<img class="lazy_load" data-src="/img/pokemon/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': pokemonTypeString
            });
        }

        data['pokemon_filters'] = pokemonData;
    }

    if (permViewMap && showRaidFilter) {
        const generalString = i18n.__('filter_general');
        const raidLevelsString = i18n.__('filter_raid_levels');
        const pokemonString = i18n.__('filter_pokemon');

        const raidTimers = i18n.__('filter_raid_timers');
        let raidData = [];
        const filter = generateShowHideButtons('timers', 'raid-timers');
        const size = generateSizeButtons('timers', 'raid-timers');
        raidData.push({
            'id': {
                'formatted': 0,//String(format: "%03d", 0),
                'sort': 0
            },
            'name': raidTimers,
            'image': '<img class="lazy_load" data-src="/img/misc/timer.png" style="height:50px; width:50px;">',
            'filter': filter,
            'size': size,
            'type': generalString
        });

        //Level
        for (let i = 1; i <= 5; i++) {
            const raidLevel = i18n.__('filter_raid_level_' + i);
            const filter = generateShowHideButtons(i, 'raid-level');
            const size = generateSizeButtons(i, 'raid-level');
            raidData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': raidLevel,
                'image': `<img class="lazy_load" data-src="/img/egg/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': raidLevelsString
            });
        }

        //Pokemon
        for (let i = 1; i <= config.map.maxPokemonId; i++) {
            const filter = generateShowHideButtons(i, 'raid-pokemon');
            const size = generateSizeButtons(i, 'raid-pokemon');
            raidData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i+200
                },
                'name': i18n.__('poke_' + i),
                'image': `<img class="lazy_load" data-src="/img/pokemon/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': pokemonString
            });
        }
        data['raid_filters'] = raidData;
    }

    if (permViewMap && showGymFilter) {
        const gymTeamString = i18n.__('filter_gym_team');
        const gymOptionsString = i18n.__('filter_gym_options');
        const availableSlotsString = i18n.__('filter_gym_available_slots');
        let gymData = [];

        //Team
        for (let i = 0; i <= 3; i++) {
            const gymTeam = i18n.__('filter_gym_team_' + i);
            const filter = generateShowHideButtons(i, 'gym-team');
            const size = generateSizeButtons(i, 'gym-team');
            gymData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': gymTeam,
                'image': `<img class="lazy_load" data-src="/img/gym/${i}_${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': gymTeamString
            });
        }

        // EX raid eligible gyms
        const exFilter = generateShowHideButtons('ex', 'gym-ex');
        const exSize = generateSizeButtons('ex', 'gym-ex');
        gymData.push({
            'id': {
                'formatted': 5,//String(format: "%03d", 5), //Need a better way to display, new section?
                'sort': 5
            },
            'name': i18n.__('filter_raid_ex') ,
            'image': '<img class="lazy_load" data-src="/img/item/1403.png" style="height:50px; width:50px;">',
            'filter': exFilter,
            'size': exSize,
            'type': gymOptionsString
        });

        //Available slots
        for (let i = 0; i <= 6; i++) {
            const availableSlots = i18n.__('filter_gym_available_slots_' + i);
            const filter = generateShowHideButtons(i, 'gym-slots');
            const size = generateSizeButtons(i, 'gym-slots');
            const team = Math.round((Math.random() % 3) + 1);
            gymData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i+100
                },
                'name': availableSlots,
                'image': `<img class="lazy_load" data-src="/img/gym/${(i == 6 ? 0 : team)}_${(6 - i)}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': availableSlotsString
            });
        }
        data['gym_filters'] = gymData;
    }

    if (permViewMap && showQuestFilter) {
        const pokemonTypeString = i18n.__('filter_pokemon');
        const miscTypeString = i18n.__('filter_misc');
        const itemsTypeString = i18n.__('filter_items');
        let questData = [];

        // Misc
        for (let i = 1; i <= 3; i++) {
            let itemName = '';
            switch (i) {
            case 1:
                itemName = i18n.__('filter_stardust');
                break;
            case 2:
                itemName = i18n.__('filter_xp');
                break;
            default:
                itemName = i18n.__('filter_candy');
                break;
            }
            const filter = generateShowHideButtons(i, 'quest-misc');
            const size = generateSizeButtons(i, 'quest-misc');
            questData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': itemName,
                'image': `<img class="lazy_load" data-src="/img/item/${-i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': miscTypeString
            });
        }

        // Items
        let itemI = 1;
        let keys = Object.keys(InventoryItemId);
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const itemId = InventoryItemId[key];
            const filter = generateShowHideButtons(itemId, 'quest-item');
            const size = generateSizeButtons(itemId, 'quest-item');
            questData.push({
                'id': {
                    'formatted': itemI,//String(format: "%03d", itemI),
                    'sort': itemI+100
                },
                'name': i18n.__('item_' + itemId) ,
                'image': `<img class="lazy_load" data-src="/img/item/${itemId}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': itemsTypeString
            });
            itemI++;
        }

        // Pokemon
        for (let i = 1; i <= config.map.maxPokemonId; i++) {
            const filter = generateShowHideButtons(i, 'quest-pokemon');
            const size = generateSizeButtons(i, 'quest-pokemon');
            questData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i + 200
                },
                'name': i18n.__('poke_' + i),
                'image': `<img class="lazy_load" data-src="/img/pokemon/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': pokemonTypeString
            });
        }
        data['quest_filters'] = questData;
    }

    if (permViewMap && showPokestopFilter) {
        const pokestopOptionsString = i18n.__('filter_pokestop_options');
        let pokestopData = [];

        const pokestopNormal = i18n.__('filter_pokestop_normal');
        const pokestopInvasion = i18n.__('filter_pokestop_invasion');
        const filter = generateShowHideButtons('normal', 'pokestop-normal');
        const size = generateSizeButtons('normal', 'pokestop-normal');
        pokestopData.push({
            'id': {
                'formatted': 0,//String(format: "%03d", 0),
                'sort': 0
            },
            'name': pokestopNormal,
            'image': '<img class="lazy_load" data-src="/img/pokestop/0.png" style="height:50px; width:50px;">',
            'filter': filter,
            'size': size,
            'type': pokestopOptionsString
        });

        for (let i = 1; i <= 4; i++) {
            const pokestopLure = i18n.__('filter_pokestop_lure_' + i);
            const filter = generateShowHideButtons(i, 'pokestop-lure');
            const size = generateSizeButtons(i, 'pokestop-lure');
            pokestopData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': pokestopLure,
                'image': `<img class="lazy_load" data-src="/img/pokestop/${i}.png" style="height:50px; width:50px;">`,
                'filter': filter,
                'size': size,
                'type': pokestopOptionsString
            });
        }

        const trFilter = generateShowHideButtons('invasion', 'pokestop-invasion');
        const trSize = generateSizeButtons('invasion', 'pokestop-invasion');
        pokestopData.push({
            'id': {
                'formatted': 5,//String(format: "%03d", 5),
                'sort': 5
            },
            'name': pokestopInvasion,
            'image': '<img class="lazy_load" data-src="/img/pokestop/i0.png" style="height:50px; width:50px;">',
            'filter': trFilter,
            'size': trSize,
            'type': pokestopOptionsString
        });
        data['pokestop_filters'] = pokestopData;
    }

    if (permViewMap && showSpawnpointFilter) {
        const spawnpointOptionsString = i18n.__('filter_spawnpoint_options');
        const spawnpointWithTimerString = i18n.__('filter_spawnpoint_with_timer');
        const spawnpointWithoutTimerString = i18n.__('filter_spawnpoint_without_timer');

        let spawnpointData = [];
        let filter = generateShowHideButtons('no-timer', 'spawnpoint-timer');
        let size = generateSizeButtons('no-timer', 'spawnpoint-timer');
        spawnpointData.push({
            'id': {
                'formatted': 0,//String(format: "%03d", 0),
                'sort': 0
            },
            'name': spawnpointWithoutTimerString,
            'image': '<img class="lazy_load" data-src="/img/spawnpoint/0.png" style="height:50px; width:50px;">',
            'filter': filter,
            'size': size,
            'type': spawnpointOptionsString
        });

        filter = generateShowHideButtons('with-timer', 'spawnpoint-timer');
        size = generateSizeButtons('with-timer', 'spawnpoint-timer');
        spawnpointData.push({
            'id': {
                'formatted': 1,//String(format: "%03d", 1),
                'sort': 1
            },
            'name': spawnpointWithTimerString,
            'image': '<img class="lazy_load" data-src="/img/spawnpoint/1.png" style="height:50px; width:50px;">',
            'filter': filter,
            'size': size,
            'type': spawnpointOptionsString
        });
        data['spawnpoint_filters'] = spawnpointData;
    }

    return data;
}

async function getPokemon(minLat, maxLat, minLon, maxLon, showIV, updated, pokemonFilterExclude = null, pokemonFilterIV = null) {
    let keys = Object.keys(pokemonFilterIV || []);
    if (keys && keys.length > 0 && showIV) {
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            const ivFilter = pokemonFilterIV[key];
            const id = parseInt(ivFilter.key);
            if (id) {
                if (!pokemonFilterExclude.includes(id)) {
                    pokemonFilterExclude.push(id);
                }
            }
        }
    }

    let sqlExclude = '';
    if (pokemonFilterExclude.length === 0) {
        sqlExclude = '';
    } else {
        let sqlExcludeCreate = 'pokemon_id NOT IN (';
        for (let i = 0; i < pokemonFilterExclude.length; i++) {
            if (i === pokemonFilterExclude.length - 1) {
                sqlExcludeCreate += '?)';
            } else {
                sqlExcludeCreate += '?, ';
            }
        }
        sqlExclude = sqlExcludeCreate;
    }

    let sqlAdd = '';
    if ((pokemonFilterIV === null || pokemonFilterIV.length === 0 || !showIV) && pokemonFilterExclude.length === 0) {
        sqlAdd = '';
    } else if (pokemonFilterIV === null || pokemonFilterIV.length === 0 || !showIV) {
        sqlAdd = ` AND ${sqlExclude}`;
    } else {
        let orPart = '';
        let andPart = '';
        const keys = Object.keys(pokemonFilterIV);
        keys.forEach(function(key) {
            const filter = pokemonFilterIV[key];
            const sql = sqlifyIvFilter(filter.value);
            if (sql && sql !== false && sql !== '') {
                if (filter.key === 'and') {
                    andPart += sql;
                } else if (pokemonFilterExclude && pokemonFilterExclude.length > 0) {
                    if (orPart && orPart === '') {
                        orPart += '(';
                    } else {
                        orPart += ' OR ';
                    }
                    if (filter.key === 'or') {
                        orPart += `${sq}`;
                    } else {
                        const id = parseInt(filter.key) || 0;
                        orPart += ` (pokemon_id = ${id} AND ${sql})`;
                    }
                }
            }
        });
        if (sqlExclude && sqlExclude !== '') {
            if (orPart === '') {
                orPart += '(';
            } else {
                orPart += ' OR ';
            }
            orPart += `(${sqlExclude})`;
        }
        if (orPart && orPart !== '') {
            orPart += ')';
        }

        if (orPart && orPart !== '' && andPart && andPart !== '') {
            sqlAdd = ` AND (${orPart} AND ${andPart})`;
        } else if (orPart && orPart !== '') {
            sqlAdd = ` AND (${orPart})`;
        } else if (andPart && andPart !== '') {
            sqlAdd = ` AND (${andPart})`;
        } else if (sqlExclude && sqlExclude !== '') {
            sqlAdd = ` AND (${sqlExclude})`;
        } else {
            sqlAdd = '';
        }
    }

    const sql = `
    SELECT id, pokemon_id, lat, lon, spawn_id, expire_timestamp, atk_iv, def_iv, sta_iv, move_1, move_2,
            gender, form, cp, level, weather, costume, weight, size, display_pokemon_id, pokestop_id, updated,
            first_seen_timestamp, changed, cell_id, expire_timestamp_verified, shiny, username
    FROM pokemon
    WHERE expire_timestamp >= UNIX_TIMESTAMP() AND lat >= ? AND lat <= ? AND lon >= ? AND
            lon <= ? AND updated > ? ${sqlAdd}
    `;
    let args = [minLat, maxLat, minLon, maxLon, updated];
    for (let i = 0; i < pokemonFilterExclude.length; i++) {
        args.push(pokemonFilterExclude[i]);
    }
    const results = await query(sql, args);
    let pokemons = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            let atkIv;
            let defIv;
            let staIv;
            let move1;
            let move2;
            let cp;
            let level;
            let weight;
            let size;
            let displayPokemonId;
            if (showIV) {
                atkIv = result.atk_iv;
                defIv = result.def_iv;
                staIv = result.sta_iv;
                move1 = result.move_1;
                move2 = result.move_2;
                cp = result.cp;
                level = result.level;
                weight = result.weight;
                size = result.size;
                displayPokemonId = result.display_pokemon_id;
            } else {
                atkIv = null;
                defIv = null;
                staIv = null;
                move1 = null;
                move2 = null;
                cp = null;
                level = null;
                weight = null;
                size = null;
                displayPokemonId = null;
            }

            pokemons.push({
                id: result.id,
                pokemon_id: result.pokemon_id,
                lat: result.lat,
                lon: result.lon,
                spawn_id: result.spawn_id,
                expire_timestamp: result.expire_timestamp,
                atk_iv: atkIv,
                def_iv: defIv,
                sta_iv: staIv,
                move_1: move1,
                move_2: move2,
                gender: result.gender,
                form: result.form,
                cp: cp,
                level: level,
                weight: weight,
                costume: result.costume,
                size: size,
                display_pokemon_id: displayPokemonId,
                weather: result.weather,
                shiny: result.shiny,
                username: result.username,
                pokestop_id: result.pokestop_id,
                first_seen_timestamp: result.first_seen_timestamp,
                updated: result.updated,
                changed: result.changed,
                cellId: result.cell_id,
                expire_timestamp_verified: result.expire_timestamp_verified
            });
        }
    }
    return pokemons;
}

async function getGyms(minLat, maxLat, minLon, maxLon, updated, raidsOnly, showRaids, raidFilterExclude = null, gymFilterExclude = null) {
    let excludedLevels = []; //int
    let excludedPokemon = []; //int
    let excludeAllButEx = false;
    let excludedTeams = []; //int
    let excludedAvailableSlots = []; //int

    if (showRaids && raidFilterExclude) {
        for (let i = 0; i < raidFilterExclude.length; i++) {
            const filter = raidFilterExclude[i];
            if (filter.includes('l')) {
                const id = parseInt(filter.replace('l', ''));
                excludedLevels.push(id);
            } else if (filter.includes('p')) {
                const id = parseInt(filter.replace('p', ''));
                excludedPokemon.push(id);
            }
        }
    }

    if (gymFilterExclude) {
        for (let i = 0; i < gymFilterExclude.length; i++) {
            const filter = gymFilterExclude[i];
            if (filter.includes('t')) {
                const id = parseInt(filter.replace('t', ''));
                excludedTeams.push(id);
            } else if (filter.includes('s')) {
                const id = parseInt(filter.replace('s', ''));
                excludedAvailableSlots.push(id);
            } else if (filter.includes('ex')) {
                excludeAllButEx = true;
            }
        }
    }

    let excludeLevelSQL = '';
    let excludePokemonSQL = '';
    let excludeAllButExSQL = '';
    let excludeTeamSQL = '';
    let excludeAvailableSlotsSQL = '';

    if (showRaids) {
        if (excludedLevels.length === 0) {
            excludeLevelSQL = '';
        } else {
            let sqlExcludeCreate = 'AND (raid_level NOT IN (';
            for (let i = 0; i < excludedLevels.length; i++) {
                if (i === excludedLevels.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
            }
            sqlExcludeCreate += '?))';
            excludeLevelSQL = sqlExcludeCreate;
        }

        if (excludedPokemon.length === 0) {
            excludePokemonSQL = '';
        } else {
            let sqlExcludeCreate = 'AND (raid_pokemon_id NOT IN (';
            for (let i = 0; i < excludedPokemon.length; i++) {
                if (i === excludedPokemon.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
            }
            sqlExcludeCreate += '?))';
            excludePokemonSQL = sqlExcludeCreate;
        }
    } else {
        excludeLevelSQL = '';
        excludePokemonSQL = '';
    }
    if (excludedTeams.length === 0) {
        excludeTeamSQL = '';
    } else {
        let sqlExcludeCreate = 'AND (team_id NOT IN (';
        for (let i = 0; i < excludedTeams.length; i++) {
            if (i === excludedTeams.length - 1) {
                sqlExcludeCreate += '?))';
            } else {
                sqlExcludeCreate += '?, ';
            }
        }
        excludeTeamSQL = sqlExcludeCreate;
    }

    if (excludedAvailableSlots.length === 0) {
        excludeAvailableSlotsSQL = '';
    } else {
        let sqlExcludeCreate = 'AND (availble_slots NOT IN (';
        for (let i = 0; i < excludedAvailableSlots.length; i++) {
            if (i === excludedTeams.length - 1) {
                sqlExcludeCreate += '?))';
            } else {
                sqlExcludeCreate += '?, ';
            }
        }
        excludeAvailableSlotsSQL = sqlExcludeCreate;
    }

    if (excludeAllButEx) {
        excludeAllButExSQL = 'AND (ex_raid_eligible = 1)';
    } else {
        excludeAllButExSQL = '';
    }

    let sql = `
    SELECT id, lat, lon, name, url, guarding_pokemon_id, last_modified_timestamp, team_id, raid_end_timestamp,
            raid_spawn_timestamp, raid_battle_timestamp, raid_pokemon_id, enabled, availble_slots, updated,
            raid_level, ex_raid_eligible, in_battle, raid_pokemon_move_1, raid_pokemon_move_2, raid_pokemon_form,
            raid_pokemon_cp, raid_pokemon_gender, raid_is_exclusive, cell_id, total_cp, sponsor_id
    FROM gym
    WHERE lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? AND updated > ? AND deleted = false
        ${excludeLevelSQL} ${excludePokemonSQL} ${excludeTeamSQL} ${excludeAvailableSlotsSQL}
        ${excludeAllButExSQL}
    `;
    if (raidsOnly) {
        sql += ' AND raid_end_timestamp >= UNIX_TIMESTAMP()';
    }

    let args = [minLat, maxLat, minLon, maxLon, updated];
    for (let i = 0; i < excludedLevels.length; i++) {
        args.push(excludedLevels[i]);
    }
    for (let i = 0; i < excludedPokemon.length; i++) {
        args.push(excludedPokemon[i]);
    }
    for (let i = 0; i < excludedTeams.length; i++) {
        args.push(excludedTeams[i]);
    }
    for (let i = 0; i < excludedAvailableSlots.length; i++) {
        args.push(excludedAvailableSlots[i]);
    }

    const results = await query(sql, args);
    let gyms = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            let raidEndTimestamp;
            let raidSpawnTimestamp;
            let raidBattleTimestamp;
            let raidPokemonId;
            if (showRaids) {
                raidEndTimestamp = result.raid_end_timestamp;
                raidSpawnTimestamp = result.raid_spawn_timestamp;
                raidBattleTimestamp = result.raid_battle_timestamp;
                raidPokemonId = result.raid_pokemon_id;
            } else {
                raidEndTimestamp = null;
                raidSpawnTimestamp = null;
                raidBattleTimestamp = null;
                raidPokemonId = null;
            }
            gyms.push({
                id: result.id,
                lat: result.lat,
                lon: result.lon,
                name: result.name,
                url: result.url,
                guarding_pokemon_id: result.guarding_pokemon_id,
                enabled: result.enabled,
                last_modified_timestamp: result.last_modified_timestamp,
                team_id: result.team_id,
                raid_end_timestamp: raidEndTimestamp,
                raid_spawn_timestamp: raidSpawnTimestamp,
                raid_battle_timestamp: raidBattleTimestamp,
                raid_pokemon_id: raidPokemonId,
                raid_level: result.raid_level,
                availble_slots: result.availble_slots,
                updated: result.updated,
                ex_raid_eligible: result.ex_raid_eligible,
                in_battle: result.in_battle,
                raid_pokemon_move1: result.raid_pokemon_move_1,
                raid_pokemon_move2: result.raid_pokemon_move_2,
                raid_pokemon_form: result.raid_pokemon_form,
                raid_pokemon_cp: result.raid_pokemon_cp,
                raid_pokemon_gender: result.raid_pokemon_gender,
                raid_is_exclusive: result.raid_is_exclusive,
                cell_id: result.cell_id,
                total_cp: result.total_cp,
                sponsor_id: result.sponsor_id
            });
        }
    }
    return gyms;
}

async function getPokestops(minLat, maxLat, minLon, maxLon, updated, questsOnly, showQuests, showLures, showInvasions, questFilterExclude = null, pokestopFilterExclude = null) {
    let excludedTypes = []; //int
    let excludedPokemon = []; //int
    let excludedItems = []; //int
    let excludedLures = []; //int
    let excludeNormal = false;
    let excludeInvasion = true;

    if (showQuests && questsOnly && questFilterExclude) {
        for (let i = 0; i < questFilterExclude.length; i++) {
            const filter = questFilterExclude[i];
            if (filter.includes('p')) {
                const id = parseInt(filter.replace('p', ''));
                excludedPokemon.push(id);
            } else if (filter.includes('i')) {
                const id = parseInt(filter.replace('i', ''));
                if (id > 0) {
                    excludedItems.push(id);
                } else if (id < 0) {
                    excludedTypes.push(-id);
                }
            }
        }
    }

    if (pokestopFilterExclude) {
        for (let i = 0; i < pokestopFilterExclude.length; i++) {
            const filter = pokestopFilterExclude[i];
            if (filter.includes('normal')) {
                excludeNormal = true;
            } else if (showLures && filter.includes('l')) {
                const id = parseInt(filter.replace('l', ''));
                excludedLures.push(id + 500);
            } else if (showInvasions && filter.includes('invasion')) {
                excludeInvasion = true;
            }
        }
    }

    let excludeTypeSQL = '';
    let excludePokemonSQL = '';
    let excludeItemSQL = '';
    let excludeLureSQL = '';
    let excludePokestopSQL = '';

    if (showQuests && questsOnly) {
        if (excludedTypes.length === 0) {
            excludeTypeSQL = '';
        } else {
            let sqlExcludeCreate = 'AND (quest_reward_type IS NULL OR quest_reward_type NOT IN (';
            for (let i = 0; i < excludedTypes.length; i++) {
                if (i === excludedTypes.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
            }
            excludeTypeSQL = sqlExcludeCreate;
        }

        if (excludedPokemon.length === 0) {
            excludePokemonSQL = '';
        } else {
            let sqlExcludeCreate = 'AND (quest_pokemon_id IS NULL OR quest_pokemon_id NOT IN (';
            for (let i = 0; i < excludedPokemon.length; i++) {
                if (i === excludedPokemon.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
            }
            excludePokemonSQL = sqlExcludeCreate;
        }

        if (excludedItems.length === 0) {
            excludeItemSQL = '';
        } else {
            let sqlExcludeCreate = 'AND (quest_item_id IS NULL OR quest_item_id NOT IN (';
            for (let i = 0; i < excludedItems.length; i++) {
                if (i === excludedItems.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
            }
            excludeItemSQL = sqlExcludeCreate;
        }
    } else {
        excludeTypeSQL = '';
        excludePokemonSQL = '';
        excludeItemSQL = '';
    }

    if (excludeNormal || !excludedLures.length > 0 || excludeInvasion) {
        if (excludedLures.length === 0) {
            excludeLureSQL = '';
        } else {
            let sqlExcludeCreate = 'AND (lure_id NOT IN (';
            for (let i = 0; i < excludedLures.length; i++) {
                if (i === excludedLures.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
            }
            excludeLureSQL = sqlExcludeCreate;
        }

        let hasLureSQL = `(lure_expire_timestamp IS NOT NULL AND lure_expire_timestamp >= UNIX_TIMESTAMP() ${excludeLureSQL})`;
        let hasNoLureSQL = '(lure_expire_timestamp IS NULL OR lure_expire_timestamp < UNIX_TIMESTAMP())';
        let hasInvasionSQL = '(incident_expire_timestamp IS NOT NULL AND incident_expire_timestamp >= UNIX_TIMESTAMP())';
        let hasNoInvasionSQL = '(incident_expire_timestamp IS NULL OR incident_expire_timestamp < UNIX_TIMESTAMP())';
        excludePokestopSQL = 'AND (';
        if (excludeNormal && excludeInvasion) {
            excludePokestopSQL += `(${hasLureSQL} AND ${hasNoInvasionSQL})`;
        } else if (excludeNormal && !excludeInvasion) {
            excludePokestopSQL += `(${hasLureSQL} OR ${hasInvasionSQL})`;
        } else if (!excludeNormal && excludeInvasion) {
            excludePokestopSQL += `((${hasNoLureSQL} OR ${hasLureSQL}) AND ${hasNoInvasionSQL})`;
        } else {
            excludePokestopSQL += `(${hasNoLureSQL} OR ${hasLureSQL})`;
        }
        excludePokestopSQL += ')';
    } else {
        excludePokestopSQL = '';
    }

    let sql = `
    SELECT id, lat, lon, name, url, enabled, lure_expire_timestamp, last_modified_timestamp, updated,
            quest_type, quest_timestamp, quest_target, CAST(quest_conditions AS CHAR),
            CAST(quest_rewards AS CHAR), quest_template, cell_id, lure_id, pokestop_display,
            incident_expire_timestamp, grunt_type, sponsor_id
    FROM pokestop
    WHERE lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? AND updated > ? AND
        deleted = false ${excludeTypeSQL} ${excludePokemonSQL} ${excludeItemSQL} ${excludePokestopSQL}
    `;
    if (questsOnly) {
        sql += ' AND quest_reward_type IS NOT NULL';
    }

    let args = [minLat, maxLat, minLon, maxLon, updated];
    for (let i = 0; i < excludedTypes.length; i++) {
        const id = parseInt(excludedTypes[i]);
        switch (id) {
        case 1:
            args.push(3);
            break;
        case 2:
            args.push(1);
            break;
        case 3:
            args.push(4);
            break;
        }
    }
    for (let i = 0; i < excludedPokemon.length; i++) {
        const id = parseInt(excludedPokemon[i]);
        args.push(id);
    }
    for (let i = 0; i < excludedItems.length; i++) {
        args.push(excludedItems[i]);
    }
    for (let i = 0; i < excludedLures.length; i++) {
        args.push(excludedLures[i]);
    }

    const results = await query(sql, args);
    let pokestops = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            let lureExpireTimestamp;
            if (showLures) {
                lureExpireTimestamp = result.lure_expire_timestamp;
            } else {
                lureExpireTimestamp = null;
            }
            let questType;
            let questTimestamp;
            let questTarget;
            let questConditions;
            let questRewards;
            let questTemplate;
            if (showQuests) {
                questType = result.quest_type;
                questTimestamp = result.quest_timestamp;
                questTarget = result.quest_target;
                questConditions = result.quest_conditions || [];//JSON.parse(result.quest_conditions || {});
                questRewards = result.quest_rewards || [];//JSON.parse(result.quest_rewards || {});
                questTemplate = result.quest_template;
            } else {
                questType = null;
                questTimestamp = null;
                questTarget = null;
                questConditions = null;
                questRewards = null;
                questTemplate = null;
            }

            let lureId;
            if (showLures) {
                lureId = result.lure_id;
            } else {
                lureId = null;
            }
            let pokestopDisplay;
            let incidentExpireTimestamp;
            let gruntType;
            if (showInvasions) {
                pokestopDisplay = result.pokestop_display;
                incidentExpireTimestamp = result.incident_expire_timestamp;
                gruntType = result.grunt_type;
            } else {
                pokestopDisplay = null;
                incidentExpireTimestamp = null;
                gruntType = null;
            }

            pokestops.push({
                id: result.id,
                lat: result.lat,
                lon: result.lon,
                name: result.name,
                url: result.url,
                enabled: result.enabled,
                lure_expire_timestamp: lureExpireTimestamp,
                last_modified_timestamp: result.last_modified_timestamp,
                updated: result.updated,
                quest_type: questType,
                quest_target: questTarget,
                quest_timestamp: questTimestamp,
                quest_conditions: questConditions,
                quest_rewards: questRewards,
                quest_template: questTemplate,
                cell_id: result.cell_id,
                lure_id: lureId,
                pokestop_display: pokestopDisplay,
                incident_expire_timestamp: incidentExpireTimestamp,
                grunt_type: gruntType,
                sponsor_id: result.sponsor_id
            });
        }
    }

    return pokestops;
}

async function getSpawnpoints(minLat, maxLat, minLon, maxLon, updated, spawnpointFilterExclude = null) {
    let excludeWithoutTimer = false;
    let excludeWithTimer = false;
    if (spawnpointFilterExclude) {
        for (let i = 0; i < spawnpointFilterExclude.length; i++) {
            const filter = spawnpointFilterExclude[i];
            if (filter.includes('no-timer')) {
                excludeWithoutTimer = true;
            } else if (filter.includes('with-timer')) {
                excludeWithTimer = true;
            }
        }
    }

    let excludeTimerSQL = '';
    if (!excludeWithoutTimer && !excludeWithTimer) {
        excludeTimerSQL = '';
    } else if (!excludeWithoutTimer && excludeWithTimer) {
        excludeTimerSQL = 'AND (despawn_sec IS NULL)';
    } else if (excludeWithoutTimer && !excludeWithTimer) {
        excludeTimerSQL = 'AND (despawn_sec IS NOT NULL)';
    } else {
        excludeTimerSQL = 'AND (despawn_sec IS NULL AND despawn_sec IS NOT NULL)';
    }

    const sql = `
    SELECT id, lat, lon, updated, despawn_sec
    FROM spawnpoint
    WHERE lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? AND updated > ? ${excludeTimerSQL}
    `;

    let args = [minLat, maxLat, minLon, maxLon, updated];
    const results = await query(sql, args);
    let spawnpoints = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            spawnpoints.push({
                id: result.id,
                lat: result.lat,
                lon: result.lon,
                updated: result.updated,
                despawn_second: result.despawn_sec
            });
        }
    }
    return spawnpoints;
}

async function getDevices() {
    const sql = `
    SELECT uuid, instance_name, last_host, last_seen, account_username, last_lat, last_lon, device_group
    FROM device
    `;
    const results = await query(sql);
    let devices = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            devices.push({
                uuid: result.uuid,
                instance_name: result.instance_name,
                last_host: result.last_host,
                last_seen: result.last_seen,
                account_username: result.account_username,
                last_lat: result.last_lat,
                last_lon: result.last_lon,
                device_group: result.device_group
            });
        }
    }
    return devices;
}

async function getS2Cells(minLat, maxLat, minLon, maxLon, updated) {
    const minLatReal = minLat - 0.01;
    const maxLatReal = maxLat + 0.01;
    const minLonReal = minLon - 0.01;
    const maxLonReal = maxLon + 0.01;
    const sql = `
    SELECT id, level, center_lat, center_lon, updated
    FROM s2cell
    WHERE center_lat >= ? AND center_lat <= ? AND center_lon >= ? AND center_lon <= ? AND updated > ?
    `;
    let args = [minLatReal, maxLatReal, minLonReal, maxLonReal, updated];
    const results = await query(sql, args);
    let cells = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            cells.push({
                id: result.id,
                level: result.level,
                centerLat: result.center_lat,
                centerLon: result.center_lon,
                updated: result.updated
            });
        }
    }
    return cells;
}

async function getWeather(minLat, maxLat, minLon, maxLon, updated) {
    const minLatReal = minLat - 0.1;
    const maxLatReal = maxLat + 0.1;
    const minLonReal = minLon - 0.1;
    const maxLonReal = maxLon + 0.1;
    const sql = `
    SELECT id, level, latitude, longitude, gameplay_condition, wind_direction, cloud_level,
            rain_level, wind_level, snow_level, fog_level, special_effect_level, severity, warn_weather, updated
    FROM weather
    WHERE latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ? AND updated > ?
    `;

    const args = [minLatReal, maxLatReal, minLonReal, maxLonReal, updated];
    const results = await query(sql, args);
    let weather = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            weather.push({
                id: result.id,
                level: result.level,
                latitude: result.latitude,
                longitude: result.longitude,
                gameplay_condition: result.gameplay_condition,
                wind_direction: result.wind_direction,
                cloud_level: result.cloud_level,
                rain_level: result.rain_level,
                wind_level: result.wind_level,
                snow_level: result.snow_level,
                fog_level: result.fog_level,
                special_effect_level: result.special_effect_level,
                severity: result.severity,
                warn_weather: result.warn_weather,
                updated: result.updated
            });
        }
    }
    return weather;
}

function generateShowHideButtons(id, type, ivLabel = '') {
    const hideString = i18n.__('filter_hide');
    const showString = i18n.__('filter_show');
    const filter = `
    <div class="btn-group btn-group-toggle" data-toggle="buttons">
        <label class="btn btn-sm btn-off select-button-new" data-id="${id}" data-type="${type}" data-info="hide">
            <input type="radio" name="options" id="hide" autocomplete="off">${hideString}
        </label>
        <label class="btn btn-sm btn-on select-button-new" data-id="${id}" data-type="${type}" data-info="show">
            <input type="radio" name="options" id="show" autocomplete="off">${showString}
        </label>
        ${ivLabel}
    </div>
    `;
    return filter;
}

function generateSizeButtons(id, type) {
    const smallString = i18n.__('filter_small');
    const normalString = i18n.__('filter_normal');
    const largeString = i18n.__('filter_large');
    const hugeString = i18n.__('filter_huge');
    const size = `
    <div class="btn-group btn-group-toggle" data-toggle="buttons">
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="small">
            <input type="radio" name="options" id="hide" autocomplete="off">${smallString}
        </label>
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="normal">
            <input type="radio" name="options" id="show" autocomplete="off">${normalString}
        </label>
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="large">
            <input type="radio" name="options" id="show" autocomplete="off">${largeString}
        </label>
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="huge">
            <input type="radio" name="options" id="show" autocomplete="off">${hugeString}
        </label>
    </div>
    `;
    return size;
}

function sqlifyIvFilter(filter) {
    let fullMatch = "^(?!&&|\\|\\|)((\\|\\||&&)?\\(?((A|D|S|L)?[0-9.]+(-(A|D|S|L)?[0-9.]+)?)\\)?)*$";
    /*
    if (filter !~ fullMatch) {
        return null;
    }
    */

    let singleMatch = "(A|D|S|L)?[0-9.]+(-(A|D|S|L)?[0-9.]+)?";
    let sql = singleMatch.r.replaceAll(filter)// { match in
    console.log("SQL:", sql);
    if (sql === null) {
        return '';
    }
    let firstGroup = match.group(0)
    let firstGroupNumbers = firstGroup.replace("A", "");
    firstGroupNumbers = firstGroupNumbers.replace("D", "");
    firstGroupNumbers = firstGroupNumbers.replace("S", "");
    firstGroupNumbers = firstGroupNumbers.replace("L", "");

    let column = '';
    if (firstGroup.includes("A")) {
        column = "atk_iv";
    } else if (firstGroup.includes("D")) {
        column = "def_iv";
    } else if (firstGroup.includes("S")) {
        column = "sta_iv";
    } else if (firstGroup.includes("L")) {
        column = "level";
    } else {
        column = "iv";
    }

    if (firstGroupNumbers.includes("-")) { // min max
        let split = firstGroupNumbers.split("-");
        if (split.length !== 2) { 
            return nil
        }
        let number0 = parseFloat(split[0]);
        let number1 = parseFloat(split[1]);
        let min = 0;
        let max = 0;
        if (number0 < number1) {
            min = number0;
            max = number1;
        } else {
            max = number1;
            min = number0;
        }
        return `${column} >= ${min} AND ${column} <= ${max}`;
    } else { // fixed
        let number = parseFloat(firstGroupNumbers);
        if (number === undefined || number === null) {
            return null;
        }
        return `${column} = ${number}`;
    }

    sql = sql.replace("&&", " AND ");
    sql = sql.replace("||", " OR ");
    return sql;
    //return '';
}

module.exports = {
    getData
};