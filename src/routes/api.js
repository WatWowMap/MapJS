'use strict';

const i18n = require('i18n');
const express = require('express');
const router = express.Router();

const config = require('../services/config.js');
const map = require('../data/map.js');
const utils = require('../services/utils.js');

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

router.post('/search', async (req, res) => {
    const data = await getSearch(req.body);
    res.json({ data: data });
});

router.get('/get_settings', async (req, res) => {
    const data = getSettings();
    res.json({ data: data });
});

const getSettings = () => {
    const settingsData = [];
    //const settingColorString = i18n.__('settings_color');
    const pokemonSettingsString = i18n.__('filter_pokemon');
    const pokemonGlowString = i18n.__('settings_pokemon_glow');
    const clusterPokemonString = i18n.__('settings_cluster_pokemon');
    const pokemonTimers = i18n.__('filter_pokemon_timers');
    const gymSettingsString = i18n.__('filter_gyms');
    const clusterGymsString = i18n.__('settings_cluster_gyms');
    const pokestopSettingsString = i18n.__('filter_pokestops');
    const clusterPokestopsString = i18n.__('settings_cluster_pokestops');
    const nestSettingsString = i18n.__('filter_nests');
    const nestPolygonsString = i18n.__('settings_nest_polygons');
    const raidTimersString = i18n.__('filter_raid_timers');
    const invasionTimersString = i18n.__('filter_invasion_timers');

    /*
    const glowColorLabel = `
    <label class="btn btn-sm btn-size select-button-new" data-id="pokemon-glow" data-type="pokemon-glow" data-info="color">
        <input type="radio" name="options" id="color" autocomplete="off">${settingColorString}
    </label>
    `;
    */
    settingsData.push({
        'id': {
            'sort': utils.zeroPad(0, 3)
        },
        'name': pokemonGlowString,
        'filter': generateShowHideButtons('pokemon-glow', 'pokemon-glow'),//, glowColorLabel),
        'type': pokemonSettingsString
    });
    settingsData.push({
        'id': {
            'sort': utils.zeroPad(1, 3)
        },
        'name': clusterPokemonString,
        'filter': generateShowHideButtons('pokemon-cluster', 'pokemon-cluster'),
        'type': pokemonSettingsString
    });
    settingsData.push({
        'id': {
            'sort': utils.zeroPad(2, 3)
        },
        'name': pokemonTimers,
        'filter': generateShowHideButtons('pokemon-timers', 'pokemon-timers'),
        'type': pokemonSettingsString,
    });
    settingsData.push({
        'id': {
            'sort': utils.zeroPad(10, 3)
        },
        'name': clusterGymsString,
        'filter': generateShowHideButtons('gym-cluster', 'gym-cluster'),
        'type': gymSettingsString
    });
    settingsData.push({
        'id': {
            'sort': utils.zeroPad(11, 3)
        },
        'name': raidTimersString,
        'filter': generateShowHideButtons('raid-timers', 'raid-timers'),
        'type': gymSettingsString // TODO: Change to Raid Settings
    });
    settingsData.push({
        'id': {
            'sort': utils.zeroPad(20, 3)
        },
        'name': clusterPokestopsString,
        'filter': generateShowHideButtons('pokestop-cluster', 'pokestop-cluster'),
        'type': pokestopSettingsString
    });
    settingsData.push({
        'id': {
            'sort': utils.zeroPad(21, 3)
        },
        'name': invasionTimersString,
        'filter': generateShowHideButtons('invasion-timers', 'invasion-timers'),
        'type': pokestopSettingsString // TODO: Change to Invasion Settings
    });
    settingsData.push({
        'id': {
            'sort': utils.zeroPad(30, 3)
        },
        'name': nestPolygonsString,
        'filter': generateShowHideButtons('nest-polygon', 'nest-polygon'),
        'type': nestSettingsString
    });
    /*
    settingsData.push({
        'id': {
            'formatted': utils.zeroPad(1, 3),
            'sort': 1
        },
        'name': 'Glow Color',
        'image': '<img class="lazy_load" data-src="/img/spawnpoint/1.png" style="height:50px; width:50px">',
        'filter': generateTextBox('glow-color', 'pokemon-glow'),
        'type': pokemonSettingsLabel
    });
    settingsData.push({
        'id': {
            'formatted': utils.zeroPad(2, 3),
            'sort': 2
        },
        'name': 'Minimum IV Glow',
        'image': '<img class="lazy_load" data-src="/img/spawnpoint/1.png" style="height:50px; width:50px">',
        'filter': generateShowHideButtons('glow-iv', 'pokemon-glow'),
        'type': pokemonSettingsLabel
    });
    */
    const data = {
        settings: settingsData
    };
    return data;
};

const getData = async (perms, filter) => {
    //console.log('Filter:', filter);
    const minLat = parseFloat(filter.min_lat);
    const maxLat = parseFloat(filter.max_lat);
    const minLon = parseFloat(filter.min_lon);
    const maxLon = parseFloat(filter.max_lon);
    const showGyms = filter.show_gyms && filter.show_gyms !== 'false' || false;
    const showRaids = filter.show_raids && filter.show_raids !== 'false' || false;
    const showPokestops = filter.show_pokestops && filter.show_pokestops !== 'false' || false;
    const showQuests = filter.show_quests && filter.show_quests !== 'false' || false;
    const showInvasions = filter.show_invasions && filter.show_invasions !== 'false' || false;
    const questFilterExclude = filter.quest_filter_exclude ? JSON.parse(filter.quest_filter_exclude || {}) : []; //string 
    const showPokemon = filter.show_pokemon && filter.show_pokemon !== 'false' || false;
    const pokemonFilterExclude = filter.pokemon_filter_exclude ? JSON.parse(filter.pokemon_filter_exclude || {}) : []; //int
    const pokemonFilterIV = filter.pokemon_filter_iv ? JSON.parse(filter.pokemon_filter_iv || {}) : []; //dictionary
    const raidFilterExclude = filter.raid_filter_exclude ? JSON.parse(filter.raid_filter_exclude || {}) : [];
    const gymFilterExclude = filter.gym_filter_exclude ? JSON.parse(filter.gym_filter_exclude || {}) : [];
    const pokestopFilterExclude = filter.pokestop_filter_exclude ? JSON.parse(filter.pokestop_filter_exclude || {}) : [];
    const invasionFilterExclude = filter.invasion_filter_exclude ? JSON.parse(filter.invasion_filter_exclude || {}) : [];
    const spawnpointFilterExclude = filter.spawnpoint_filter_exclude ? JSON.parse(filter.spawnpoint_filter_exclude || {}) : [];
    const nestFilterExclude = filter.nest_filter_exclude ? JSON.parse(filter.nest_filter_exclude || {}) : [];
    const portalFilterExclude = filter.portal_filter_exclude ? JSON.parse(filter.portal_filter_exclude || {}) : [];
    const weatherFilterExclude = filter.weather_filter_exclude ? JSON.parse(filter.weather_filter_exclude || {}) : [];
    const deviceFilterExclude = filter.device_filter_exclude ? JSON.parse(filter.device_filter_exclude || {}) : [];
    const showSpawnpoints = filter.show_spawnpoints && filter.show_spawnpoints !== 'false' || false;
    const showCells = filter.show_cells && filter.show_cells !== 'false' || false;
    const showSubmissionPlacementCells = filter.show_submission_placement_cells && filter.show_submission_placement_cells !== 'false' || false;
    const showSubmissionTypeCells = filter.show_submission_type_cells && filter.show_submission_type_cells !== 'false' || false;
    const showWeather = filter.show_weather && filter.show_weather !== 'false' || false;
    const showNests = filter.show_nests && filter.show_nests !== 'false' || false;
    const showPortals = filter.show_portals && filter.show_portals !== 'false' || false;
    const showActiveDevices = filter.show_active_devices && filter.show_active_devices !== 'false' || false;
    const showPokemonFilter = filter.show_pokemon_filter && filter.show_pokemon_filter !== 'false' || false;
    const showQuestFilter = filter.show_quest_filter && filter.show_quest_filter !== 'false' || false;
    const showInvasionFilter = filter.show_invasion_filter && filter.show_invasion_filter !== 'false' || false;
    const showRaidFilter = filter.show_raid_filter && filter.show_raid_filter !== 'false' || false;
    const showGymFilter = filter.show_gym_filter && filter.show_gym_filter !== 'false' || false;
    const showPokestopFilter = filter.show_pokestop_filter && filter.show_pokestop_filter !== 'false' || false;
    const showSpawnpointFilter = filter.show_spawnpoint_filter && filter.show_spawnpoint_filter !== 'false' || false;
    const showNestFilter = filter.show_nest_filter && filter.show_nest_filter !== 'false' || false;
    const showPortalFilter = filter.show_portal_filter && filter.show_portal_filter !== 'false' || false;
    const showWeatherFilter = filter.show_weather_filter && filter.show_weather_filter !== 'false' || false;
    const showDeviceFilter = filter.show_device_filter && filter.show_device_filter !== 'false' || false;
    const lastUpdate = filter.last_update || 0;
    if ((showGyms || showRaids || showPokestops || showQuests || showInvasions || showPokemon || showSpawnpoints ||
        showCells || showSubmissionTypeCells || showSubmissionPlacementCells || showWeather || showNests || showPortals || showActiveDevices) &&
        (minLat === null || maxLat === null || minLon === null || maxLon === null)) {
        return;
    }

    // TODO: Create default config for Perms when Discord is disabled
    const permViewMap = perms ? perms.map !== false : true;
    const permShowPokemon = perms ? perms.pokemon !== false : true;
    const permShowLures = perms ? perms.lures !== false : true;
    const permShowIV = perms ? perms.iv !== false : true;
    const permShowPVP = perms ? perms.pvp !== false : true;
    const permShowRaids = perms ? perms.raids !== false : true;
    const permShowGyms = perms ? perms.gyms !== false : true;
    const permShowQuests = perms ? perms.quests !== false : true;
    const permShowPokestops = perms ? perms.pokestops !== false : true;
    const permShowInvasions = perms ? perms.invasions !== false : true;
    const permShowSpawnpoints = perms ? perms.spawnpoints !== false : true;
    const permShowDevices = perms ? perms.devices !== false : true;
    const permShowS2Cells = perms ? perms.cells !== false : true;
    const permShowSubmissionCells = perms ? perms.submissionCells !== false : true;
    const permShowWeather = perms ? perms.weather !== false : true;
    const permShowNests = perms ? perms.nests !== false : true;
    const permShowPortals = perms ? perms.portals !== false : true;

    let data = {};
    if ((permShowGyms && showGyms) || (permShowRaids && showRaids)) {
        data['gyms'] = await map.getGyms(minLat, maxLat, minLon, maxLon, lastUpdate, showRaids, showGyms, raidFilterExclude, gymFilterExclude);
    }
    if (
        (permShowPokestops && showPokestops) ||
        (permShowQuests && showQuests) ||
        (permShowInvasions && showInvasions)
    ) {
        data['pokestops'] = await map.getPokestops(minLat, maxLat, minLon, maxLon, lastUpdate, permShowPokestops && showPokestops, permShowQuests && showQuests, permShowLures, permShowInvasions && showInvasions, questFilterExclude, pokestopFilterExclude, invasionFilterExclude);
    }
    if (permShowPokemon && showPokemon) {
        data['pokemon'] = await map.getPokemon(minLat, maxLat, minLon, maxLon, permShowPVP, permShowIV, lastUpdate, pokemonFilterExclude, pokemonFilterIV);
    }
    if (permShowSpawnpoints && showSpawnpoints) {
        data['spawnpoints'] = await map.getSpawnpoints(minLat, maxLat, minLon, maxLon, lastUpdate, spawnpointFilterExclude);
    }
    if (permShowDevices && showActiveDevices) {
        data['active_devices'] = await map.getDevices(deviceFilterExclude);
    }
    if (permShowS2Cells && showCells) {
        data['cells'] = await map.getS2Cells(minLat, maxLat, minLon, maxLon, lastUpdate);
    }
    if (permShowSubmissionCells && showSubmissionPlacementCells) {
        let placementCells = await map.getSubmissionPlacementCells(minLat, maxLat, minLon, maxLon);
        data['submission_placement_cells'] = placementCells.cells;
        data['submission_placement_rings'] = placementCells.rings; // TODO: Maybe remove since we can show ingress portals now
    }
    if (permShowSubmissionCells && showSubmissionTypeCells) {
        data['submission_type_cells'] = await map.getSubmissionTypeCells(minLat, maxLat, minLon, maxLon);
    }
    if (permShowWeather && showWeather) {
        data['weather'] = await map.getWeather(minLat, maxLat, minLon, maxLon, lastUpdate, weatherFilterExclude);
    }
    if (permShowNests && showNests) {
        data['nests'] = await map.getNests(minLat, maxLat, minLon, maxLon, nestFilterExclude);
    }
    if (permShowPortals && showPortals) {
        data['portals'] = await map.getPortals(minLat, maxLat, minLon, maxLon, portalFilterExclude);
    }

    if (permViewMap && showPokemonFilter) {
        const onString = i18n.__('filter_on');
        const offString = i18n.__('filter_off');
        const ivString = i18n.__('filter_iv');
    
        const globalIVString = i18n.__('filter_global_iv');
        const globalFiltersString = i18n.__('filter_global_filters');
        const pokemonTypeString = i18n.__('filter_pokemon');
    
        const configureString = i18n.__('filter_configure');
        const andString = i18n.__('filter_and');
        const orString = i18n.__('filter_or');
    
        const pokemonData = [];

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
                        'formatted': utils.zeroPad(i, 3),
                        'sort': i
                    },
                    'name': globalIVString,
                    'image': `${andOrString}`,
                    'filter': filter,
                    'size': size,
                    'type': globalFiltersString,
                    'types': null
                });
            }
        }

        const bigKarpString = i18n.__('filter_big_karp');
        const tinyRatString = i18n.__('filter_tiny_rat');
        for (let i = 0; i <= 1; i++) {
            const id = i === 0 ? 'big_karp' : 'tiny_rat';            
            const filter = generateShowHideButtons(id, 'pokemon-size');
            const sizeString = i === 0 ? bigKarpString : tinyRatString;
            const size = generateSizeButtons(id, 'pokemon-size');      
            pokemonData.push({
                'id': {
                    'formatted': utils.zeroPad(i+2, 3),
                    'sort': i + 3
                },
                'name': sizeString,
                'image': {
                    type: 'pokemon',
                    pokemonId: i === 0 ? 129 : 19
                },
                'filter': filter,
                'size': size,
                'type': globalFiltersString,
                'types': null
            });
        }

        const pokemonTimersVerified = i18n.__('filter_pokemon_timers_verified');
        pokemonData.push({
            'id': {
                'formatted': utils.zeroPad(2, 3),
                'sort': 2 + 5
            },
            'name': pokemonTimersVerified,
            'image': {
                type: 'img',
                path: '/misc/verified.png'
            },
            'filter': generateShowHideButtons('timers-verified', 'pokemon-timers-verified'),
            'size': generateSizeButtons('timers-verified', 'pokemon-timers-verified'),
            'type': globalFiltersString,
            'types': null
        });

        for (let i = 1; i < config.map.maxPokemonId; i++) {
            const pkmn = masterfile.pokemon[i];
            const forms = Object.keys(pkmn.forms);
            for (let j = 0; j < forms.length; j++) {
                const formId = forms[j];
                const types = JSON.stringify(pkmn.types);
                // Grab form from masterfile for consistent language
                let formName = pkmn.forms[formId].name;
                if (skipForms.includes(formName.toLowerCase())) {
                    // Skip Shadow and Purified forms
                    continue;
                }
                formName = formName === 'Normal' ? '' : formName;
                const id = formId === '0' ? i : i + '-' + formId;
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
                        'formatted': utils.zeroPad(i, 3),
                        'sort': i * 100 + j
                    },
                    'name': i18n.__('poke_' + i) + (formId === '0' ? '' : ' ' + formName),
                    'image': {
                        type: 'pokemon',
                        pokemonId: i,
                        form: formId
                    },
                    'filter': filter,
                    'size': size,
                    'type': pokemonTypeString,
                    'types': types
                });
            }
        }
        data['pokemon_filters'] = pokemonData;
    }

    if (permViewMap && showRaidFilter) {
        const raidLevelsString = i18n.__('filter_raid_levels');
        const pokemonString = i18n.__('filter_pokemon');
        const raidData = [];

        //Level
        for (let i = 1; i <= 6; i++) {
            const raidLevel = i18n.__('filter_raid_level_' + i);
            raidData.push({
                'id': {
                    'formatted': utils.zeroPad(i, 3),
                    'sort': i
                },
                'name': raidLevel,
                'image': {
                    type: 'img',
                    path: `/egg/${i}.png`
                },
                'filter': generateShowHideButtons(i, 'raid-level'),
                'size': generateSizeButtons(i, 'raid-level'),
                'type': raidLevelsString
            });
        }

        //Pokemon
        const pokemon = await map.getAvailableRaidBosses();
        for (let i = 0; i < pokemon.length; i++) {
            const poke = pokemon[i];
            const pokemonId = poke.id;
            const formId = '' + poke.form_id;
            // TODO: Get form name from master file since locale form ids are off
            let formName = i18n.__('form_' + formId);
            formName = formName === 'Normal' ? '' : formName;
            const id = formId === '0' ? pokemonId : pokemonId + '-' + formId;
            raidData.push({
                'id': {
                    'formatted': utils.zeroPad(pokemonId, 3),
                    'sort': i+200
                },
                'name': i18n.__('poke_' + pokemonId) + (formId === '0' ? '' : ' ' + formName),
                'image': {
                    type: 'pokemon',
                    pokemonId: pokemonId,
                    form: formId
                },
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
        const gymData = [];

        //Team
        for (let i = 0; i <= 3; i++) {
            const gymTeam = i18n.__('filter_gym_team_' + i);
            gymData.push({
                'id': {
                    'formatted': utils.zeroPad(i, 3),
                    'sort': i
                },
                'name': gymTeam,
                'image': {
                    type: 'img',
                    path: `/gym/${i}_${i}.png`
                },
                'filter': generateShowHideButtons(i, 'gym-team'),
                'size': generateSizeButtons(i, 'gym-team'),
                'type': gymTeamString
            });
        }

        // EX raid eligible gyms
        gymData.push({
            'id': {
                'formatted': utils.zeroPad(5, 3),
                'sort': 5
            },
            'name': i18n.__('filter_raid_ex') ,
            'image': {
                type: 'img',
                path: '/item/1403.png'
            },
            'filter': generateShowHideButtons('ex', 'gym-ex'),
            'size': generateSizeButtons('ex', 'gym-ex'),
            'type': gymOptionsString
        });

        // In-battle gyms
        gymData.push({
            'id': {
                'formatted': utils.zeroPad(6, 3),
                'sort': 6
            },
            'name': i18n.__('filter_gym_in_battle') ,
            'image': {
                type: 'img',
                path: '/battle/0_0.png'
            },
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
                    'formatted': utils.zeroPad(i, 3),
                    'sort': i + 100
                },
                'name': availableSlots,
                'image': {
                    type: 'img',
                    path: `/gym/${i == 6 ? 0 : team}_${6 - i}.png`
                },
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
        const onString = i18n.__('filter_on');
        const offString = i18n.__('filter_off');
        const globalCandyString = i18n.__('filter_global_candy_count');
        const globalStardustString = i18n.__('filter_global_stardust_count');
        const globalFiltersString = i18n.__('filter_global_filters');
        const configureString = i18n.__('filter_configure');
        const questData = [];

        // Global filters
        const candyFilter = `
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
            <label class="btn btn-sm btn-off select-button-new" data-id="candy-count" data-type="quest-candy-count" data-info="off">
                <input type="radio" name="options" id="hide" autocomplete="off">${offString}
            </label>
            <label class="btn btn-sm btn-on select-button-new" data-id="candy-count" data-type="quest-candy-count" data-info="on">
                <input type="radio" name="options" id="show" autocomplete="off">${onString}
            </label>
        </div>
        `;
        const candySize = `<button class="btn btn-sm btn-primary configure-button-new" data-id="candy-count" data-type="quest-candy-count" data-info="global-candy-count">${configureString}</button>`;
        questData.push({
            'id': {
                'formatted': utils.zeroPad(0, 3),
                'sort': 0
            },
            'name': globalCandyString,
            'image': {
                type: 'img',
                path: '/item/1301.png'
            },
            'filter': candyFilter,
            'size': candySize,
            'type': globalFiltersString
        });

        const stardustFilter = `
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
            <label class="btn btn-sm btn-off select-button-new" data-id="stardust-count" data-type="quest-stardust-count" data-info="off">
                <input type="radio" name="options" id="hide" autocomplete="off">${offString}
            </label>
            <label class="btn btn-sm btn-on select-button-new" data-id="stardust-count" data-type="quest-stardust-count" data-info="on">
                <input type="radio" name="options" id="show" autocomplete="off">${onString}
            </label>
        </div>
        `;
        const stardustSize = `<button class="btn btn-sm btn-primary configure-button-new" data-id="stardust-count" data-type="quest-stardust-count" data-info="global-stardust-count">${configureString}</button>`;
        questData.push({
            'id': {
                'formatted': utils.zeroPad(1, 3),
                'sort': 1
            },
            'name': globalStardustString,
            'image': {
                type: 'img',
                path: '/item/-1.png'
            },
            'filter': stardustFilter,
            'size': stardustSize,
            'type': globalFiltersString
        });

        // Misc
        const itemNames = [
            'filter_stardust',
            'filter_xp',
            'filter_candy',
            'filter_avatar_clothing',
            'filter_quest',
            'filter_pokecoin',
            'filter_sticker',
            //'filter_mega_resource',
        ];
        for (let i = 1; i <= itemNames.length; i++) {
            questData.push({
                'id': {
                    'formatted': utils.zeroPad(i, 3),
                    'sort': i
                },
                'name': i18n.__(itemNames[i - 1]),
                'image': {
                    type: 'img',
                    path: `/item/${-i}.png`
                },
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
                    'formatted': utils.zeroPad(itemId, 3),
                    'sort': itemId + 10
                },
                'name': i18n.__('item_' + itemId),
                'image': {
                    type: 'img',
                    path: `/item/${itemId}.png`
                },
                'filter': generateShowHideButtons(itemId, 'quest-item'),
                'size': generateSizeButtons(itemId, 'quest-item'),
                'type': itemsTypeString
            });
        }

        // Mega energy
        for (let i = 0; i < rewards.evolutions.length; i++) {
            const pokemonId = parseInt(rewards.evolutions[i].id);
            //const amount = rewards.mega[i].amount;
            questData.push({
                'id': {
                    'formatted': utils.zeroPad(pokemonId, 3),
                    'sort': pokemonId + 2000
                },
                'name': i18n.__('poke_' + pokemonId) ,
                'image': {
                    type: 'pokemon',
                    pokemonId: pokemonId
                },
                'filter': generateShowHideButtons(pokemonId, 'quest-evolution'),
                'size': generateSizeButtons(pokemonId, 'quest-evolution'),
                'type': i18n.__('filter_quest_mega_energy')
            });
        }

        // Pokemon
        for (let i = 0; i < rewards.pokemon.length; i++) {
            const pokeId = rewards.pokemon[i];
            questData.push({
                'id': {
                    'formatted': utils.zeroPad(pokeId, 3),
                    'sort': pokeId + 5000
                },
                'name': i18n.__('poke_' + pokeId),
                'image': {
                    type: 'pokemon',
                    pokemonId: pokeId
                },
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
        const pokestopData = [];
        pokestopData.push({
            'id': {
                'formatted': utils.zeroPad(0, 3),
                'sort': 0
            },
            'name': pokestopNormal,
            'image': {
                type: 'img',
                path: '/pokestop/0.png'
            },
            'filter': generateShowHideButtons('normal', 'pokestop-normal'),
            'size': generateSizeButtons('normal', 'pokestop-normal'),
            'type': pokestopOptionsString
        });

        if (permShowLures) {
            for (let i = 1; i <= 4; i++) {
                const pokestopLure = i18n.__('filter_pokestop_lure_' + i);
                pokestopData.push({
                    'id': {
                        'formatted': utils.zeroPad(i, 3),
                        'sort': i
                    },
                    'name': pokestopLure,
                    'image': {
                        type: 'img',
                        path: `/pokestop/${i}.png`
                    },
                    'filter': generateShowHideButtons(i, 'pokestop-lure'),
                    'size': generateSizeButtons(i, 'pokestop-lure'),
                    'type': pokestopOptionsString
                });
            }
        }
        data['pokestop_filters'] = pokestopData;
    }

    if (permViewMap && showInvasionFilter) {
        const gruntTypeString = i18n.__('filter_grunt_type');
        const invasionData = [];

        // Grunt Type
        for (let i = 1; i <= 50; i++) {
            invasionData.push({
                'id': {
                    'formatted': utils.zeroPad(i, 3),
                    'sort': i
                },
                'name': i18n.__('grunt_' + i),
                'image': {
                    type: 'img',
                    path: `/grunt/${i}.png`
                },
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
        const spawnpointData = [];
        spawnpointData.push({
            'id': {
                'formatted': utils.zeroPad(0, 3),
                'sort': 0
            },
            'name': spawnpointWithoutTimerString,
            'image': {
                type: 'img',
                path: '/spawnpoint/0.png'
            },
            'filter': generateShowHideButtons('no-timer', 'spawnpoint-timer'),
            'size': generateSizeButtons('no-timer', 'spawnpoint-timer'),
            'type': spawnpointOptionsString
        });

        spawnpointData.push({
            'id': {
                'formatted': utils.zeroPad(1, 3),
                'sort': 1
            },
            'name': spawnpointWithTimerString,
            'image': {
                type: 'img',
                path: '/spawnpoint/1.png'
            },
            'filter': generateShowHideButtons('with-timer', 'spawnpoint-timer'),
            'size': generateSizeButtons('with-timer', 'spawnpoint-timer'),
            'type': spawnpointOptionsString
        });
        data['spawnpoint_filters'] = spawnpointData;
    }

    if (permViewMap && showNestFilter) {
        const pokemonString = i18n.__('filter_pokemon');
        const onString = i18n.__('filter_on');
        const offString = i18n.__('filter_off');
        const globalAverageString = i18n.__('filter_global_avg');
        const globalFiltersString = i18n.__('filter_global_filters');
        const configureString = i18n.__('filter_configure');
        const nestData = [];
        const filter = `
        <div class="btn-group btn-group-toggle" data-toggle="buttons">
            <label class="btn btn-sm btn-off select-button-new" data-id="avg" data-type="nest-avg" data-info="off">
                <input type="radio" name="options" id="hide" autocomplete="off">${offString}
            </label>
            <label class="btn btn-sm btn-on select-button-new" data-id="avg" data-type="nest-avg" data-info="on">
                <input type="radio" name="options" id="show" autocomplete="off">${onString}
            </label>
        </div>
        `;
        const size = `<button class="btn btn-sm btn-primary configure-button-new" data-id="avg" data-type="nest-avg" data-info="global-avg">${configureString}</button>`;
        nestData.push({
            'id': {
                'formatted': utils.zeroPad(0, 3),
                'sort': 0
            },
            'name': globalAverageString,
            'image': 'AVG',
            'filter': filter,
            'size': size,
            'type': globalFiltersString
        });

        //Pokemon
        const pokemon = await map.getAvailableNestPokemon();
        for (let i = 0; i < pokemon.length; i++) {
            let id = pokemon[i];
            nestData.push({
                'id': {
                    'formatted': utils.zeroPad(id, 3),
                    'sort': id
                },
                'name': i18n.__('poke_' + id),
                'image': {
                    type: 'pokemon',
                    pokemonId: id
                },
                'filter': generateShowHideButtons(id, 'nest-pokemon'),
                'size': generateSizeButtons(id, 'nest-pokemon'),
                'type': pokemonString
            });
        }
        data['nest_filters'] = nestData;
    }

    if (permViewMap && showPortalFilter) {
        const generalString = i18n.__('filter_general');
        const oldString = i18n.__('filter_old');
        const newString = i18n.__('filter_new');
        const oldPortalsString = i18n.__('filter_old_portals');
        const newPortalsString = i18n.__('filter_new_portals');
        const portalData = [];
        for (let i = 0; i <= 1; i++) {
            const id = i === 0 ? 'old' : 'new';
            const name = i === 0 ? oldPortalsString : newPortalsString;
            const image = i === 0 ? oldString : newString;
            portalData.push({
                'id': {
                    'formatted': utils.zeroPad(i, 3),
                    'sort': i
                },
                'name': name,
                'image': image,
                'filter': generateShowHideButtons(id, 'portal'),
                'size': generateSizeButtons(id, 'portal'),
                'type': generalString
            });
        }
        data['portal_filters'] = portalData;
    }

    if (permViewMap && showWeatherFilter) {
        const weatherOptionsString = i18n.__('filter_weather_options');
        const weatherData = [];
        for (let i = 1; i <= 7; i++) {
            const weatherNameString = i18n.__('weather_' + i);
            weatherData.push({
                'id': {
                    'formatted': utils.zeroPad(i, 3),
                    'sort': 0
                },
                'name': weatherNameString,
                'image': {
                    type: 'img',
                    path: `/weather/${i}.png`
                },
                'filter': generateShowHideButtons(i, 'weather-type'),
                'size': generateSizeButtons(i, 'weather-type'),
                'type': weatherOptionsString
            });
        }
        data['weather_filters'] = weatherData;
    }

    if (permViewMap && showDeviceFilter) {
        const deviceOptionsString = i18n.__('filter_device_options');
        const deviceOnlineString = i18n.__('filter_device_online');
        const deviceOfflineString = i18n.__('filter_device_offline');
        const deviceData = [];
        deviceData.push({
            'id': {
                'formatted': utils.zeroPad(0, 3),
                'sort': 0
            },
            'name': deviceOnlineString,
            'image': {
                type: 'img',
                path: '/device/0.png'
            },
            'filter': generateShowHideButtons('online', 'device-status'),
            'size': generateSizeButtons('online', 'device-status'),
            'type': deviceOptionsString
        });

        deviceData.push({
            'id': {
                'formatted': utils.zeroPad(1, 3),
                'sort': 1
            },
            'name': deviceOfflineString,
            'image': {
                type: 'img',
                path: '/device/1.png'
            },
            'filter': generateShowHideButtons('offline', 'device-status'),
            'size': generateSizeButtons('offline', 'device-status'),
            'type': deviceOptionsString
        });
        data['device_filters'] = deviceData;
    }

    return data;
};

const getSearch = async (filter) => {
    const searchData = await map.getSearchData(filter.lat, filter.lon, filter.id, filter.value, filter.icon_style);
    return searchData;
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
