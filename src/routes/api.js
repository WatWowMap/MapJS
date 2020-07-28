'use strict';

const i18n = require('i18n');
const express = require('express');
const router = express.Router();

const config = require('../config.json');
const map = require('../data/map.js');

const masterfile = require('../../static/data/masterfile.json');
const skipForms = ['shadow', 'purified'];

router.get('/get_data', async (req, res) => {
    const data = await getData(req.session.perms, req.query);
    res.json({ data: data });
});

router.post('/get_data', async (req, res) => {
    const data = await getData(req.session.perms, req.body);
    res.json({ data: data });
});

const getData = async (perms, filter) => {
    //console.log('Filter:', filter);
    const minLat = filter.min_lat;
    const maxLat = filter.max_lat;
    const minLon = filter.min_lon;
    const maxLon = filter.max_lon;
    const showGyms = filter.show_gyms && filter.show_gyms !== 'false' || false;
    const showRaids = filter.show_raids && filter.show_raids !== 'false' || false;
    const showPokestops = filter.show_pokestops && filter.show_pokestops !== 'false' || false;
    const showQuests = filter.show_quests && filter.show_quests !== 'false' || false;
    const showInvasions = filter.show_invasions && filter.show_invasions !== 'false' || false;
    const questFilterExclude = filter.quest_filter_exclude ? JSON.parse(filter.quest_filter_exclude || {}) : []; //string 
    const showPokemon = filter.show_pokemon && filter.show_pokemon !== 'false' || false;
    const pokemonFilterExclude = filter.pokemon_filter_exclude ? JSON.parse(filter.pokemon_filter_exclude || {}) : []; //int
    const pokemonFilterIV = filter.pokemon_filter_iv ? JSON.parse(filter.pokemon_filter_iv || {}) : []; //dictionary
    const pokemonFilterPVP = filter.pokemon_filter_pvp ? JSON.parse(filter.pokemon_filter_pvp || {}) : []; //dictionary
    const raidFilterExclude = filter.raid_filter_exclude ? JSON.parse(filter.raid_filter_exclude || {}) : [];
    const gymFilterExclude = filter.gym_filter_exclude ? JSON.parse(filter.gym_filter_exclude || {}) : [];
    const pokestopFilterExclude = filter.pokestop_filter_exclude ? JSON.parse(filter.pokestop_filter_exclude || {}) : [];
    const invasionFilterExclude = filter.invasion_filter_exclude ? JSON.parse(filter.invasion_filter_exclude || {}) : [];
    const spawnpointFilterExclude = filter.spawnpoint_filter_exclude ? JSON.parse(filter.spawnpoint_filter_exclude || {}) : [];
    const showSpawnpoints = filter.show_spawnpoints && filter.show_spawnpoints !== 'false' || false;
    const showCells = filter.show_cells && filter.show_cells !== 'false' || false;
    const showSubmissionPlacementCells = filter.show_submission_placement_cells && filter.show_submission_placement_cells !== 'false' || false;
    const showSubmissionTypeCells = filter.show_submission_type_cells && filter.show_submission_type_cells !== 'false' || false;
    const showWeather = filter.show_weather && filter.show_weather !== 'false' || false;
    const showActiveDevices = filter.show_active_devices && filter.show_active_devices !== 'false' || false;
    const showPokemonFilter = filter.show_pokemon_filter && filter.show_pokemon_filter !== 'false' || false;
    const showQuestFilter = filter.show_quest_filter && filter.show_quest_filter !== 'false' || false;
    const showInvasionFilter = filter.show_invasion_filter && filter.show_invasion_filter !== 'false' || false;
    const showRaidFilter = filter.show_raid_filter && filter.show_raid_filter !== false || 'false';
    const showGymFilter = filter.show_gym_filter && filter.show_gym_filter !== false || 'false';
    const showPokestopFilter = filter.show_pokestop_filter && filter.show_pokestop_filter !== 'false' || false;
    const showSpawnpointFilter = filter.show_spawnpoint_filter && filter.show_spawnpoint_filter !== 'false' || false;
    const lastUpdate = filter.last_update || 0;
    if ((showGyms || showRaids || showPokestops || showInvasions || showPokemon || showSpawnpoints ||
        showCells || showSubmissionTypeCells || showSubmissionPlacementCells || showWeather) &&
        (minLat === null || maxLat === null || minLon === null || maxLon === null)) {
        //res.respondWithError(BadRequest);
        return;
    }

    // TODO: Create default config for Perms when Discord is disabled
    const permViewMap = perms ? perms.map !== false : true;
    const permShowPokemon = perms ? perms.pokemon !== false : true;
    const permShowLures = perms ? perms.lures !== false : true;
    const permShowIV = perms ? perms.iv !== false : true;
    const permShowRaids = perms ? perms.raids !== false : true;
    const permShowGyms = perms ? perms.gyms !== false : true;
    const permShowQuests = perms ? perms.quests !== false : true;
    const permShowPokestops = perms ? perms.pokestops !== false : true;
    const permShowInvasions = perms ? perms.invasions !== false : true;
    const permShowSpawnpoints = perms ? perms.pokestops !== false : true;
    const permShowDevices = perms ? perms.devices !== false : true;
    const permShowS2Cells = perms ? perms.cells !== false : true;
    const permShowSubmissionCells = perms ? perms.submissionCells !== false : true;
    const permShowWeather = perms ? perms.weather !== false : true;

    let data = {};
    if ((permShowGyms && showGyms) || (permShowRaids && showRaids)) {
        data['gyms'] = await map.getGyms(minLat, maxLat, minLon, maxLon, lastUpdate, !showGyms, showRaids, raidFilterExclude, gymFilterExclude);
    }
    if (
        (permShowPokestops && showPokestops) ||
        (permShowQuests && showQuests) ||
        (permShowInvasions && showInvasions)
    ) {
        data['pokestops'] = await map.getPokestops(minLat, maxLat, minLon, maxLon, lastUpdate, showPokestops, showQuests, permShowLures, showInvasions, questFilterExclude, pokestopFilterExclude, invasionFilterExclude);
    }
    if (permShowPokemon && showPokemon) {
        data['pokemon'] = await map.getPokemon(minLat, maxLat, minLon, maxLon, permShowIV, lastUpdate, pokemonFilterExclude, pokemonFilterIV, pokemonFilterPVP);
    }
    if (permShowSpawnpoints && showSpawnpoints) {
        data['spawnpoints'] = await map.getSpawnpoints(minLat, maxLat, minLon, maxLon, lastUpdate, spawnpointFilterExclude);
    }
    if (permShowDevices && showActiveDevices) {
        data['active_devices'] = await map.getDevices();
    }
    if (permShowS2Cells && showCells) {
        data['cells'] = await map.getS2Cells(minLat, maxLat, minLon, maxLon, lastUpdate);
    }
    if (permShowSubmissionCells && showSubmissionPlacementCells) {
        let placementCells = await map.getSubmissionPlacementCells(minLat, maxLat, minLon, maxLon);
        data['submission_placement_cells'] = placementCells.cells;
        data['submission_placement_rings'] = placementCells.rings;
    }
    if (permShowSubmissionCells && showSubmissionTypeCells) {
        data['submission_type_cells'] = await map.getSubmissionTypeCells(minLat, maxLat, minLon, maxLon);
    }
    if (permShowWeather && showWeather) {
        data['weather'] = await map.getWeather(minLat, maxLat, minLon, maxLon, lastUpdate);
    }

    if (permViewMap && showPokemonFilter) {
        const onString = i18n.__('filter_on');
        const offString = i18n.__('filter_off');
        const ivString = i18n.__('filter_iv');
    
        const globalIVString = i18n.__('filter_global_iv');
        const globalPVPString = i18n.__('filter_global_pvp');
        const globalFiltersString = i18n.__('filter_global_filters');
        const pokemonTypeString = i18n.__('filter_pokemon');
    
        const configureString = i18n.__('filter_configure');
        const andString = i18n.__('filter_and');
        const orString = i18n.__('filter_or');
    
        let pokemonData = [];

        if (permShowIV) {
            // Pokemon IV filters
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
                const size = `<button class="btn btn-sm btn-primary configure-button-new" data-id="${id}" data-type="pokemon-iv" data-info="global-iv">${configureString}</button>`;
                pokemonData.push({
                    'id': {
                        'formatted': andOrString,
                        'sort': i
                    },
                    'name': globalIVString,
                    'image': andOrString,
                    'filter': filter,
                    'size': size,
                    'type': globalFiltersString
                });
            }
            // Pokemon PVP filters
            for (let i = 0; i <= 1; i++) {
                const id = i === 0 ? 'and' : 'or';
                const filter = `
                <div class="btn-group btn-group-toggle" data-toggle="buttons">
                    <label class="btn btn-sm btn-off select-button-new" data-id="${id}" data-type="pokemon-pvp" data-info="off">
                        <input type="radio" name="options" id="hide" autocomplete="off">${offString}
                    </label>
                    <label class="btn btn-sm btn-on select-button-new" data-id="${id}" data-type="pokemon-pvp" data-info="on">
                        <input type="radio" name="options" id="show" autocomplete="off">${onString}
                    </label>
                </div>
                `;
                const andOrString = i === 0 ? andString : orString;
                const size = `<button class="btn btn-sm btn-primary configure-button-new" data-id="${id}" data-type="pokemon-pvp" data-info="global-pvp">${configureString}</button>`;
                pokemonData.push({
                    'id': {
                        'formatted': andOrString,
                        'sort': i + 2
                    },
                    'name': globalPVPString,
                    'image': andOrString,
                    'filter': filter,
                    'size': size,
                    'type': globalFiltersString
                });
            }
        }

        const bigKarpString = i18n.__('filter_big_karp');
        const tinyRatString = i18n.__('filter_tiny_rat');
        for (var i = 0; i <= 1; i++) {
            const id = i === 0 ? 'big_karp' : 'tiny_rat';            
            const filter = generateShowHideButtons(id, 'pokemon-size');
            const sizeString = i === 0 ? bigKarpString : tinyRatString;
            const size = generateSizeButtons(id, 'pokemon-size');            
            pokemonData.push({
                "id": {
                    "formatted": i,//String(format: "%03d", i),
                    "sort": i + 5
                },
                "name": sizeString,
                "image": `<img class="lazy_load" data-src="/img/pokemon/${(i == 0 ? 129 : 19)}.png" style="height:50px; width:50px;">`,
                "filter": filter,
                "size": size,
                "type": globalFiltersString
            });
        }


        for (let i = 1; i < config.map.maxPokemonId; i++) {
            const pkmn = masterfile.pokemon[i];
            const forms = Object.keys(pkmn.forms);
            for (let j = 0; j < forms.length; j++) {
                const formId = forms[j];
                //const form = pkmn.forms[formId];
                let formName = pkmn.forms[formId].name;//i18n.__('form_' + formId);
                if (skipForms.includes(formName.toLowerCase())) {
                    // Skip Shadow and Purified forms
                    continue;
                }
                formName = formName === 'Normal' ? '' : formName;
                const id = formId === 0 ? i : i + '-' + formId;
                let ivLabel = '';
                if (permShowIV) {
                    ivLabel = `
                    <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="pokemon" data-info="iv">
                        <input type="radio" name="options" id="iv" autocomplete="off">${ivString}
                    </label>
                    `;
                } else {
                    ivLabel = '';
                }
                const filter = generateShowHideButtons(id, 'pokemon', ivLabel);
                const size = generateSizeButtons(id, 'pokemon');
                pokemonData.push({
                    'id': {
                        'formatted': i,//String(format: "%03d", i),
                        'sort': id + 10
                    },
                    'name': i18n.__('poke_' + i) + (formId === 0 ? '' : ' ' + formName),
                    'image': `<img class="lazy_load" data-src="/img/pokemon/${id}.png" style="height:50px; width:50px;">`,
                    'filter': filter,
                    'size': size,
                    'type': pokemonTypeString
                });
            }
        }
        data['pokemon_filters'] = pokemonData;
    }

    if (permViewMap && showRaidFilter) {
        const generalString = i18n.__('filter_general');
        const raidLevelsString = i18n.__('filter_raid_levels');
        const pokemonString = i18n.__('filter_pokemon');

        const raidTimers = i18n.__('filter_raid_timers');
        let raidData = [];
        raidData.push({
            'id': {
                'formatted': 0,//String(format: "%03d", 0),
                'sort': 0
            },
            'name': raidTimers,
            'image': '<img class="lazy_load" data-src="/img/misc/timer.png" style="height:50px; width:50px;">',
            'filter': generateShowHideButtons('timers', 'raid-timers'),
            'size': generateSizeButtons('timers', 'raid-timers'),
            'type': generalString
        });

        //Level
        for (let i = 1; i <= 5; i++) {
            const raidLevel = i18n.__('filter_raid_level_' + i);
            raidData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': raidLevel,
                'image': `<img class="lazy_load" data-src="/img/egg/${i}.png" style="height:50px; width:50px;">`,
                'filter': generateShowHideButtons(i, 'raid-level'),
                'size': generateSizeButtons(i, 'raid-level'),
                'type': raidLevelsString
            });
        }

        //Pokemon
        let pokemon = await map.getAvailableRaidBosses();
        for (let i = 0; i < pokemon.length; i++) {
            let id = pokemon[i];
            raidData.push({
                'id': {
                    'formatted': id,//String(format: "%03d", i),
                    'sort': id+200
                },
                'name': i18n.__('poke_' + id),
                'image': `<img class="lazy_load" data-src="/img/pokemon/${id}.png" style="height:50px; width:50px;">`,
                'filter': generateShowHideButtons(id, 'raid-pokemon'),
                'size': generateSizeButtons(id, 'raid-pokemon'),
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
            gymData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': gymTeam,
                'image': `<img class="lazy_load" data-src="/img/gym/${i}_${i}.png" style="height:50px; width:50px;">`,
                'filter': generateShowHideButtons(i, 'gym-team'),
                'size': generateSizeButtons(i, 'gym-team'),
                'type': gymTeamString
            });
        }

        // EX raid eligible gyms
        gymData.push({
            'id': {
                'formatted': 5,//String(format: "%03d", 5), //Need a better way to display, new section?
                'sort': 5
            },
            'name': i18n.__('filter_raid_ex') ,
            'image': '<img class="lazy_load" data-src="/img/item/1403.png" style="height:50px; width:50px;">',
            'filter': generateShowHideButtons('ex', 'gym-ex'),
            'size': generateSizeButtons('ex', 'gym-ex'),
            'type': gymOptionsString
        });

        // In-battle gyms
        gymData.push({
            'id': {
                'formatted': 6,//String(format: "%03d", 5), //Need a better way to display, new section?
                'sort': 6
            },
            'name': i18n.__('filter_gym_in_battle') ,
            'image': '<img class="lazy_load" data-src="/img/battle/0_0.png" style="height:50px; width:50px;">',
            'filter': generateShowHideButtons('battle', 'gym-battle'),
            'size': generateSizeButtons('battle', 'gym-battle'),
            'type': gymOptionsString
        });

        //Available slots
        for (let i = 0; i <= 6; i++) {
            const availableSlots = i18n.__('filter_gym_available_slots_' + i);
            const team = Math.round((Math.random() % 3) + 1);
            gymData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i+100
                },
                'name': availableSlots,
                'image': `<img class="lazy_load" data-src="/img/gym/${(i == 6 ? 0 : team)}_${(6 - i)}.png" style="height:50px; width:50px;">`,
                'filter': generateShowHideButtons(i, 'gym-slots'),
                'size': generateSizeButtons(i, 'gym-slots'),
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
            questData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': itemName,
                'image': `<img class="lazy_load" data-src="/img/item/${-i}.png" style="height:50px; width:50px;">`,
                'filter': generateShowHideButtons(i, 'quest-misc'),
                'size': generateSizeButtons(i, 'quest-misc'),
                'type': miscTypeString
            });
        }

        const rewards = await map.getAvailableQuests();
        // Items
        for (let i = 0; i < rewards.items.length; i++) {
            const itemId = rewards.items[i];
            questData.push({
                'id': {
                    'formatted': itemId,//String(format: "%03d", itemI),
                    'sort': itemId + 100
                },
                'name': i18n.__('item_' + itemId) ,
                'image': `<img class="lazy_load" data-src="/img/item/${itemId}.png" style="height:50px; width:50px;">`,
                'filter': generateShowHideButtons(itemId, 'quest-item'),
                'size': generateSizeButtons(itemId, 'quest-item'),
                'type': itemsTypeString
            });
        }

        // Pokemon
        for (let i = 0; i < rewards.pokemon.length; i++) {
            const pokeId = rewards.pokemon[i];
            questData.push({
                'id': {
                    'formatted': pokeId,//String(format: "%03d", i),
                    'sort': pokeId + 2000
                },
                'name': i18n.__('poke_' + pokeId),
                'image': `<img class="lazy_load" data-src="/img/pokemon/${pokeId}.png" style="height:50px; width:50px;">`,
                'filter': generateShowHideButtons(pokeId, 'quest-pokemon'),
                'size': generateSizeButtons(pokeId, 'quest-pokemon'),
                'type': pokemonTypeString
            });
        }
        data['quest_filters'] = questData;
    }

    if (permViewMap && showPokestopFilter) {
        const pokestopOptionsString = i18n.__('filter_pokestop_options');
        const pokestopNormal = i18n.__('filter_pokestop_normal');
        let pokestopData = [];
        pokestopData.push({
            'id': {
                'formatted': 0,//String(format: "%03d", 0),
                'sort': 0
            },
            'name': pokestopNormal,
            'image': '<img class="lazy_load" data-src="/img/pokestop/0.png" style="height:50px; width:50px;">',
            'filter': generateShowHideButtons('normal', 'pokestop-normal'),
            'size': generateSizeButtons('normal', 'pokestop-normal'),
            'type': pokestopOptionsString
        });

        for (let i = 1; i <= 4; i++) {
            const pokestopLure = i18n.__('filter_pokestop_lure_' + i);
            pokestopData.push({
                'id': {
                    'formatted': i,//String(format: "%03d", i),
                    'sort': i
                },
                'name': pokestopLure,
                'image': `<img class="lazy_load" data-src="/img/pokestop/${i}.png" style="height:50px; width:50px;">`,
                'filter': generateShowHideButtons(i, 'pokestop-lure'),
                'size': generateSizeButtons(i, 'pokestop-lure'),
                'type': pokestopOptionsString
            });
        }
        data['pokestop_filters'] = pokestopData;
    }

    if (permViewMap && showInvasionFilter) {
        const gruntTypeString = i18n.__('filter_grunt_type');
        let invasionData = [];

        // Grunt Type
        for (let i = 1; i <= 50; i++) {
            invasionData.push({
                'id': {
                    'formatted': i,
                    'sort': i
                },
                'name': i18n.__('grunt_' + i),
                'image': `<img class="lazy_load" data-src="/img/grunt/${i}.png" style="height:50px; width:50px;">`,
                'filter': generateShowHideButtons(i, 'invasion-grunt'),
                'size': generateSizeButtons(i, 'invasion-grunt'),
                'type': gruntTypeString
            });
        }
        data['invasion_filters'] = invasionData;
    }

    if (permViewMap && showSpawnpointFilter) {
        const spawnpointOptionsString = i18n.__('filter_spawnpoint_options');
        const spawnpointWithTimerString = i18n.__('filter_spawnpoint_with_timer');
        const spawnpointWithoutTimerString = i18n.__('filter_spawnpoint_without_timer');

        let spawnpointData = [];
        spawnpointData.push({
            'id': {
                'formatted': 0,//String(format: "%03d", 0),
                'sort': 0
            },
            'name': spawnpointWithoutTimerString,
            'image': '<img class="lazy_load" data-src="/img/spawnpoint/0.png" style="height:50px; width:50px;">',
            'filter': generateShowHideButtons('no-timer', 'spawnpoint-timer'),
            'size': generateSizeButtons('no-timer', 'spawnpoint-timer'),
            'type': spawnpointOptionsString
        });

        spawnpointData.push({
            'id': {
                'formatted': 1,//String(format: "%03d", 1),
                'sort': 1
            },
            'name': spawnpointWithTimerString,
            'image': '<img class="lazy_load" data-src="/img/spawnpoint/1.png" style="height:50px; width:50px;">',
            'filter': generateShowHideButtons('with-timer', 'spawnpoint-timer'),
            'size': generateSizeButtons('with-timer', 'spawnpoint-timer'),
            'type': spawnpointOptionsString
        });
        data['spawnpoint_filters'] = spawnpointData;
    }

    return data;
};

const generateShowHideButtons = (id, type, ivLabel = '') => {
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
};

const generateSizeButtons = (id, type) => {
    //const smallString = i18n.__('filter_small');
    const normalString = i18n.__('filter_normal');
    //const largeString = i18n.__('filter_large');
    const hugeString = i18n.__('filter_huge');
    const size = `
    <div class="btn-group btn-group-toggle" data-toggle="buttons">
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="normal">
            <input type="radio" name="options" id="show" autocomplete="off">${normalString}
        </label>
        <label class="btn btn-sm btn-size select-button-new" data-id="${id}" data-type="${type}" data-info="huge">
            <input type="radio" name="options" id="show" autocomplete="off">${hugeString}
        </label>
    </div>
    `;
    return size;
};

module.exports = router;