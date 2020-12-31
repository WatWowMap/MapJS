/* global BigInt */
'use strict';

const i18n = require('i18n');
const S2 = require('nodes2ts');
const sanitizer = require('sanitizer');
const requireFromString = require('require-from-string');

const config = require('../services/config.js');
const MySQLConnector = require('../services/mysql.js');

const db = new MySQLConnector(config.db.scanner);
const dbManual = new MySQLConnector(config.db.manualdb);

const masterfile = require('../../static/data/masterfile.json');

const dbSelection = (category) => {
    let dbSelection;
    if (config.db.scanner.useFor.length === 0 && config.db.manualdb.useFor.length === 0) {
        dbSelection = category === 'nest' || category === 'portal'
            ? dbManual : db;
    } else {
        dbSelection = config.db.scanner.useFor.includes(category)
            ? db : dbManual;
    }
    return dbSelection;
};

const getPokemon = async (minLat, maxLat, minLon, maxLon, showPVP, showIV, updated, pokemonFilterExclude = null, pokemonFilterIV = null) => {
    const pokemonLookup = {};
    const formLookup = {};

    let includeBigKarp = false;
    let includeTinyRat = false;
    let onlyVerifiedTimersSQL = '';
    let interestedLevelCaps = [];
    let interestedMegas = [];
    for (const key of pokemonFilterExclude || []) {
        const split = key.split('-', 2);
        if (split.length === 2) {
            const pokemonId = parseInt(split[0]);
            const formId = parseInt(split[1]);
            if ((masterfile.pokemon[pokemonId] || {}).default_form_id === formId) {
                pokemonLookup[pokemonId] = false;
            }
            formLookup[formId] = false;
        } else if (key === 'big_karp') {
            includeBigKarp = true;
        } else if (key === 'tiny_rat') {
            includeTinyRat = true;
        } else if (key === 'timers_verified') {
            onlyVerifiedTimersSQL = 'AND expire_timestamp_verified = 1';
        } else if (key === 'mega_stats') {
            interestedMegas.push(1);
            interestedMegas.push(2);
            interestedMegas.push(3);
        } else if (key === 'experimental_stats') {
            interestedMegas.push('experimental');
        } else if (key === 'level40_stats') {
            interestedLevelCaps.push(40);
        } else if (key === 'level41_stats') {
            interestedLevelCaps.push(41);
        } else if (key === 'level50_stats') {
            interestedLevelCaps.push(50);
        } else if (key === 'level51_stats') {
            interestedLevelCaps.push(51);
        } else {
            const pokemonId = parseInt(key);
            if (isNaN(pokemonId)) {
                console.warn('Unrecognized key', key);
            } else {
                pokemonLookup[pokemonId] = false;
                const defaultForm = (masterfile.pokemon[pokemonId] || {}).default_form_id;
                if (defaultForm) {
                    formLookup[defaultForm] = false;
                }
            }
        }
    }

    // eslint-disable-next-line no-unused-vars
    let orIv = (_) => false;
    // eslint-disable-next-line no-unused-vars
    let andIv = (_) => true;
    if (showIV) {
        for (const [key, filter] of Object.entries(pokemonFilterIV || {})) {
            const jsFilter = jsifyIvFilter(filter);
            if (!jsFilter) {
                continue;
            }
            const split = key.split('-', 2);
            if (split.length === 2) {
                const pokemonId = parseInt(split[0]);
                const formId = parseInt(split[1]);
                if ((masterfile.pokemon[pokemonId] || {}).default_form_id === formId) {
                    pokemonLookup[pokemonId] = jsFilter;
                }
                formLookup[formId] = jsFilter;
            } else if (key === 'and') {
                andIv = jsFilter;
            } else if (key === 'or') {
                orIv = jsFilter;
            } else {
                const pokemonId = parseInt(key);
                if (isNaN(pokemonId)) {
                    console.warn('Unrecognized key', key);
                } else {
                    pokemonLookup[pokemonId] = jsFilter;
                    const defaultForm = (masterfile.pokemon[pokemonId] || {}).default_form_id;
                    if (defaultForm) {
                        formLookup[defaultForm] = jsFilter;
                    }
                }
            }
        }
    }

    const sql = `
    SELECT id, pokemon_id, lat, lon, spawn_id, expire_timestamp, atk_iv, def_iv, sta_iv, move_1, move_2,
            gender, form, cp, level, weather, costume, weight, size, display_pokemon_id, pokestop_id, updated,
            first_seen_timestamp, changed, cell_id, expire_timestamp_verified, shiny, username,
            capture_1, capture_2, capture_3, pvp_rankings_great_league, pvp_rankings_ultra_league
    FROM pokemon
    WHERE expire_timestamp >= UNIX_TIMESTAMP() AND lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? AND updated > ? ${onlyVerifiedTimersSQL}`;
    const args = [minLat, maxLat, minLon, maxLon, updated];
    const results = await dbSelection('pokemon').query(sql, args).catch(err => {
        console.error('Failed to execute query:', sql, 'with arguments:', args, '\r\nError:', err);
    });
    let pokemon = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const filtered = {};
            if (showIV) {
                filtered.atk_iv = result.atk_iv;
                filtered.def_iv = result.def_iv;
                filtered.sta_iv = result.sta_iv;
                filtered.cp = result.cp;
                filtered.level = result.level;
                if (result.atk_iv !== null && result.def_iv !== null && result.sta_iv !== null) {
                    filtered.iv = (result.atk_iv + result.def_iv + result.sta_iv) / .45;
                }
            }
            if (showPVP && interestedLevelCaps.length > 0) {
                const { minCpGreat, minCpUltra } = config.map.pvp;
                const filterLeagueStats = (result, target, minCp) => {
                    let last;
                    for (const entry of JSON.parse(result)) {
                        if (minCp && entry.cp < minCp || entry.cap !== undefined && (entry.capped
                            ? interestedLevelCaps[interestedLevelCaps.length - 1] < entry.cap
                            : !interestedLevelCaps.includes(entry.cap))) {
                            continue;
                        }
                        if (entry.evolution) {
                            if (masterfile.pokemon[entry.pokemon].temp_evolutions[entry.evolution].unreleased
                                ? !interestedMegas.includes('experimental')
                                : !interestedMegas.includes(entry.evolution)) {
                                continue;
                            }
                        }
                        if (last !== undefined && last.pokemon === entry.pokemon &&
                            last.form === entry.form && last.evolution === entry.evolution &&
                            // if raising the level cap does not increase its level,
                            // this IV has hit the max level in the league;
                            // at this point, its rank can only go down (only unmaxed combinations can still go up);
                            // if the rank stays the same, all higher ranks are also unchanged
                            last.level === entry.level && last.rank === entry.rank) {
                            // merge two entries
                            last.cap = entry.cap;
                            if (entry.capped) {
                                last.capped = true;
                            }
                        } else {
                            target.push(entry);
                            last = entry;
                        }
                    }
                };
                if (result.pvp_rankings_great_league) {
                    filterLeagueStats(result.pvp_rankings_great_league, filtered.pvp_rankings_great_league = [], minCpGreat);
                }
                if (result.pvp_rankings_ultra_league) {
                    filterLeagueStats(result.pvp_rankings_ultra_league, filtered.pvp_rankings_ultra_league = [], minCpUltra);
                }
            }
            let pokemonFilter = result.form === 0 ? pokemonLookup[result.pokemon_id] : formLookup[result.form];
            if (pokemonFilter === undefined) {
                pokemonFilter = andIv(filtered) || orIv(filtered);
            } else if (pokemonFilter === false) {
                pokemonFilter = orIv(filtered);
            } else {
                pokemonFilter = pokemonFilter(filtered);
            }
            if (!(pokemonFilter ||
                includeBigKarp && result.pokemon_id === 129 && result.weight !== null && result.weight >= 13.125 ||
                includeTinyRat && result.pokemon_id === 19 && result.weight !== null && result.weight <= 2.40625)) {
                continue;
            }
            delete filtered.iv;
            filtered.id = result.id;
            filtered.pokemon_id = result.pokemon_id;
            filtered.lat = result.lat;
            filtered.lon = result.lon;
            filtered.spawn_id = result.spawn_id;
            filtered.expire_timestamp = result.expire_timestamp;
            filtered.gender = result.gender;
            filtered.form = result.form;
            filtered.costume = result.costume;
            filtered.weather = result.weather;
            filtered.shiny = result.shiny;
            filtered.pokestop_id = result.pokestop_id;
            filtered.first_seen_timestamp = result.first_seen_timestamp;
            filtered.updated = result.updated;
            filtered.changed = result.changed;
            filtered.cellId = result.cell_id;
            filtered.expire_timestamp_verified = result.expire_timestamp_verified;
            filtered.capture_1 = result.capture_1;
            filtered.capture_2 = result.capture_2;
            filtered.capture_3 = result.capture_3;
            if (showIV) {
                filtered.move_1 = result.move_1;
                filtered.move_2 = result.move_2;
                filtered.weight = result.weight;
                filtered.size = result.size;
                filtered.display_pokemon_id = result.display_pokemon_id;
            }
            pokemon.push(filtered);
        }
    }
    return pokemon;
};

const getGyms = async (minLat, maxLat, minLon, maxLon, updated = 0, showRaids = false, showGyms = true, permGymDetails = true, raidFilterExclude = null, gymFilterExclude = null) => {
    let excludedLevels = []; //int
    let excludeAllButEx = false;
    let excludeAllButBattles = false;
    let excludedTeams = []; //int
    let excludedAvailableSlots = []; //int

    let excludePokemonIds = [];
    let excludeFormIds = [];

    if (showRaids && raidFilterExclude) {
        for (let i = 0; i < raidFilterExclude.length; i++) {
            const filter = raidFilterExclude[i];
            if (filter.includes('l')) {
                const id = parseInt(filter.replace('l', ''));
                excludedLevels.push(id);
            } else if (filter.includes('p')) {
                const key = filter.replace('p', '');
                const split = key.split('-');
                if (split.length === 2) {
                    const pokemonId = parseInt(split[0]);
                    const formId = parseInt(split[1]);
                    if (formId === 0) {
                        excludePokemonIds.push(pokemonId);
                    } else {
                        excludeFormIds.push(formId);
                        if ((masterfile.pokemon[pokemonId] || {}).default_form_id === formId) {
                            excludePokemonIds.push(pokemonId);
                        }
                    }
                } else {
                    const id = parseInt(key);
                    if (!isNaN(id)) {
                        if (!excludePokemonIds.includes(id)) {
                            excludePokemonIds.push(id);
                        }
                        const defaultForm = (masterfile.pokemon[id] || {}).default_form_id;
                        if (defaultForm && !excludeFormIds.includes(defaultForm)) {
                            excludeFormIds.push(defaultForm);
                        }
                    }
                }
            }
        }
    }

    if (showGyms && gymFilterExclude) {
        for (let i = 0; i < gymFilterExclude.length; i++) {
            const filter = gymFilterExclude[i];
            if (filter.includes('battle')) {
                excludeAllButBattles = true;
            } else if (filter.includes('ex')) {
                excludeAllButEx = true;
            } else if (filter.includes('t')) {
                const id = parseInt(filter.replace('t', ''));
                excludedTeams.push(id);
            } else if (filter.includes('s')) {
                const id = parseInt(filter.replace('s', ''));
                excludedAvailableSlots.push(id);
            }
        }
    }

    let sqlExcludePokemon = '';
    let sqlExcludeForms = '';
    let excludeLevelSQL = '';
    let excludeAllButExSQL = '';
    let excludeAllButBattlesSQL = '';
    let excludeTeamSQL = '';
    let excludeAvailableSlotsSQL = '';
    let args = [minLat, maxLat, minLon, maxLon, updated];

    if (showRaids) {
        if (excludedLevels.length === 0) {
            excludeLevelSQL = '';
        } else {
            let sqlExcludeCreate = 'AND (raid_end_timestamp IS NULL OR raid_end_timestamp < UNIX_TIMESTAMP() OR raid_pokemon_id IS NOT NULL AND raid_pokemon_id > 0 OR raid_level NOT IN (';
            for (let i = 0; i < excludedLevels.length; i++) {
                if (i === excludedLevels.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
                args.push(excludedLevels[i]);
            }
            excludeLevelSQL = sqlExcludeCreate;
        }

        if (excludePokemonIds.length > 0) {
            let sqlExcludeCreate = 'AND raid_pokemon_id NOT IN (';
            for (let i = 0; i < excludePokemonIds.length; i++) {
                if (i === excludePokemonIds.length - 1) {
                    sqlExcludeCreate += '?)';
                } else {
                    sqlExcludeCreate += '?, ';
                }
                args.push(excludePokemonIds[i]);
            }
            sqlExcludePokemon = sqlExcludeCreate;
        }
        for (let i = 0; i < excludeFormIds.length; i++) {
            sqlExcludeForms += ', ?';
            args.push(excludeFormIds[i]);
        }
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
            args.push(excludedTeams[i]);
        }
        excludeTeamSQL = sqlExcludeCreate;
    }

    if (excludedAvailableSlots.length === 0) {
        excludeAvailableSlotsSQL = '';
    } else {
        let sqlExcludeCreate = 'AND (availble_slots NOT IN (';
        for (let i = 0; i < excludedAvailableSlots.length; i++) {
            if (i === excludedAvailableSlots.length - 1) {
                sqlExcludeCreate += '?))';
            } else {
                sqlExcludeCreate += '?, ';
            }
            args.push(excludedAvailableSlots[i]);
        }
        excludeAvailableSlotsSQL = sqlExcludeCreate;
    }

    if (excludeAllButEx) {
        excludeAllButExSQL = 'AND (ex_raid_eligible = 1)';
    } else {
        excludeAllButExSQL = '';
    }

    if (excludeAllButBattles) {
        excludeAllButBattlesSQL = 'AND (in_battle = 1)';
    } else {
        excludeAllButBattlesSQL = '';
    }

    let sql = `
    SELECT id, lat, lon, name, url, guarding_pokemon_id, last_modified_timestamp, team_id, raid_end_timestamp,
            raid_spawn_timestamp, raid_battle_timestamp, raid_pokemon_id, enabled, availble_slots, updated,
            raid_level, ex_raid_eligible, in_battle, raid_pokemon_move_1, raid_pokemon_move_2, raid_pokemon_form,
            raid_pokemon_cp, raid_pokemon_gender, raid_is_exclusive, cell_id, total_cp, sponsor_id,
            raid_pokemon_evolution, raid_pokemon_costume
    FROM gym
    WHERE lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? AND updated > ? AND deleted = false
        ${excludeLevelSQL} AND (
            raid_end_timestamp IS NULL OR raid_end_timestamp < UNIX_TIMESTAMP() OR raid_pokemon_id IS NULL OR
            (raid_pokemon_form = 0 ${sqlExcludePokemon}) OR raid_pokemon_form NOT IN (0 ${sqlExcludeForms})
        ) ${excludeTeamSQL} ${excludeAvailableSlotsSQL}
        ${excludeAllButExSQL} ${excludeAllButBattlesSQL}
    `;
    if (!showGyms) {
        sql += ' AND raid_end_timestamp IS NOT NULL AND raid_end_timestamp >= UNIX_TIMESTAMP()';
    }

    const results = await dbSelection('gym').query(sql, args)
        .catch(err => {
            if (err) {
                console.error('Failed to get gyms:', err);
                console.error('SQL:', sql);
                console.error('Args:', args);
            }
        });
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
                guarding_pokemon_id: permGymDetails ? result.guarding_pokemon_id : null,
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
                in_battle: permGymDetails ? result.in_battle : false,
                raid_pokemon_move_1: result.raid_pokemon_move_1,
                raid_pokemon_move_2: result.raid_pokemon_move_2,
                raid_pokemon_form: result.raid_pokemon_form,
                raid_pokemon_cp: result.raid_pokemon_cp,
                raid_pokemon_gender: result.raid_pokemon_gender,
                raid_is_exclusive: result.raid_is_exclusive,
                cell_id: result.cell_id,
                total_cp: permGymDetails ? result.total_cp : null,
                sponsor_id: result.sponsor_id,
                raid_pokemon_evolution: result.raid_pokemon_evolution,
                raid_pokemon_costume: result.raid_pokemon_costume,
            });
        }
    }
    return gyms;
};

const getPokestops = async (minLat, maxLat, minLon, maxLon, updated = 0, showPokestops = true, showQuests = false, showLures = false, showInvasions = false, questFilterExclude = null, pokestopFilterExclude = null, invasionFilterExclude = null) => {
    let excludedTypes = []; //int
    let excludedPokemon = []; //int
    const excludedForms = [];
    let excludedEvolutions = [];
    let excludedItems = []; //int
    let excludedLures = []; //int
    let excludedInvasions = [];
    let excludeNormal = false;
    let minimumCandyCount = 0;
    let minimumStardustCount = 0;

    if (showQuests && questFilterExclude) {
        for (let i = 0; i < questFilterExclude.length; i++) {
            const filter = questFilterExclude[i];
            if (filter.startsWith('p')) {
                const id = filter.substr(1).split('-', 2);
                if (id.length === 2) {
                    excludedForms.push(parseInt(id[1]));
                } else {
                    excludedPokemon.push(parseInt(id[0]));
                }
            } else if (filter.includes('i')) {
                const id = parseInt(filter.replace('i', ''));
                if (id > 0) {
                    excludedItems.push(id);
                } else if (id < 0) {
                    excludedTypes.push(-id);
                }
            } else if (filter.includes('e')) {
                const id = parseInt(filter.replace('e', ''));
                excludedEvolutions.push(id);
            } else if (filter.includes('candy')) {
                minimumCandyCount = parseInt(filter.replace('candy', ''));
            } else if (filter.includes('stardust')) {
                minimumStardustCount = parseInt(filter.replace('stardust', ''));
            }
        }
    }

    if (showPokestops && pokestopFilterExclude) {
        for (let i = 0; i < pokestopFilterExclude.length; i++) {
            const filter = pokestopFilterExclude[i];
            if (filter.includes('normal')) {
                excludeNormal = true;
            } else if (filter.includes('l')) {
                const id = parseInt(filter.replace('l', ''));
                excludedLures.push(id + 500);
            }
        }
    }

    if (showInvasions && invasionFilterExclude) {
        for (let i = 0; i < invasionFilterExclude.length; i++) {
            const filter = invasionFilterExclude[i];
            if (showInvasions && filter.includes('i')) {
                const id = parseInt(filter.replace('i', ''));
                excludedInvasions.push(id);
            }
        }
    }

    let args = [minLat, maxLat, minLon, maxLon, updated];
    let excludeTypeSQL = '';
    let excludePokemonSQL = '';
    let excludeEvolutionSQL = '';
    let excludeItemSQL = '';
    let excludeInvasionSQL = '';
    let excludePokestopSQL = '';

    if (showQuests) {
        if (excludedTypes.length === 0) {
            // exclude pokemon/item quests; they will be included in subsequent clauses
            excludeTypeSQL = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type NOT IN (2, 7, 12)';
        } else {
            let sqlExcludeCreate = 'OR ((quest_reward_type IS NOT NULL AND quest_reward_type NOT IN (2, 7, 12, ';
            for (let i = 0; i < excludedTypes.length; i++) {
                if (i === excludedTypes.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
                const id = parseInt(excludedTypes[i]);
                const questTypeLookup = [3, 1, 4, 5, 6, 8, 11, 12];
                if (id > 0 && id <= questTypeLookup.length) {
                    args.push(questTypeLookup[id - 1]);
                } else {
                    console.warn('Unrecognized excludedType', id);
                    args.push(-1);
                }
            }
            excludeTypeSQL = sqlExcludeCreate;
        }
        if (minimumStardustCount > 0) {
            excludeTypeSQL += ' AND (quest_reward_type <> 3 OR json_extract(json_extract(quest_rewards, "$[*].info.amount"), "$[0]") >= ?)';
            args.push(minimumStardustCount);
        }
        excludeTypeSQL += ')';

        excludePokemonSQL = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type = 7 AND quest_pokemon_id IS NOT NULL AND ((json_extract(json_extract(quest_rewards, \'$[*].info.form_id\'), \'$[0]\') = NULL OR json_extract(json_extract(quest_rewards, \'$[*].info.form_id\'), \'$[0]\') = 0)';
        if (excludedPokemon.length !== 0) {
            excludePokemonSQL += 'AND quest_pokemon_id NOT IN (';
            for (let i = 0; i < excludedPokemon.length; i++) {
                if (i === excludedPokemon.length - 1) {
                    excludePokemonSQL += '?)';
                } else {
                    excludePokemonSQL += '?,';
                }
                const id = parseInt(excludedPokemon[i]);
                args.push(id);
            }
        }
        excludePokemonSQL += 'OR json_extract(json_extract(quest_rewards, \'$[*].info.form_id\'), \'$[0]\') IS NOT NULL AND json_extract(json_extract(quest_rewards, \'$[*].info.form_id\'), \'$[0]\') NOT IN (0';
        if (excludedForms.length !== 0) {
            for (const form of excludedForms) {
                excludePokemonSQL += ',?';
                args.push(parseInt(form));
            }
        }
        excludePokemonSQL += ')))';

        if (excludedEvolutions.length === 0) {
            excludeEvolutionSQL = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type = 12 AND json_extract(json_extract(quest_rewards, "$[*].info.pokemon_id"), "$[0]") IS NOT NULL)';
        } else {
            let sqlExcludeCreate = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type = 12 AND json_extract(json_extract(quest_rewards, "$[*].info.pokemon_id"), "$[0]") NOT IN (';
            for (let i = 0; i < excludedEvolutions.length; i++) {
                if (i === excludedEvolutions.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
                const id = parseInt(excludedEvolutions[i]);
                args.push(id);
            }
            excludeEvolutionSQL = sqlExcludeCreate;
        }

        if (excludedItems.length === 0) {
            excludeItemSQL = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type = 2 AND quest_item_id IS NOT NULL)';
        } else {
            excludeItemSQL = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type = 2 AND quest_item_id IS NOT NULL AND quest_item_id NOT IN (';
            for (let i = 0; i < excludedItems.length; i++) {
                if (i === excludedItems.length - 1) {
                    excludeItemSQL += '?)';
                } else {
                    excludeItemSQL += '?, ';
                }
                args.push(excludedItems[i]);
            }
            if (minimumCandyCount > 0) {
                //excludeItemSQL += ' AND (quest_item_id <> 1301 OR JSON_VALUE(quest_rewards, "$[0].info.amount") >= ?)';
                excludeItemSQL += ' AND (quest_item_id <> 1301 OR json_extract(json_extract(quest_rewards, "$[*].info.amount"), "$[0]") >= ?)';
                args.push(minimumCandyCount);
            }
            excludeItemSQL += ')';
        }
    }

    if (showPokestops) {
        if (showLures) {
            let excludeLureSQL;
            if (excludedLures.length === 0) {
                excludeLureSQL = 'TRUE';
            } else {
                let sqlExcludeCreate = '(lure_id NOT IN (';
                for (let i = 0; i < excludedLures.length; i++) {
                    if (i === excludedLures.length - 1) {
                        sqlExcludeCreate += '?))';
                    } else {
                        sqlExcludeCreate += '?, ';
                    }
                    args.push(excludedLures[i]);
                }
                excludeLureSQL = sqlExcludeCreate;
            }

            if (excludeNormal) {
                excludePokestopSQL = `OR (lure_expire_timestamp IS NOT NULL AND lure_expire_timestamp >= UNIX_TIMESTAMP() AND ${excludeLureSQL})`;
            } else {
                excludePokestopSQL = `OR (lure_expire_timestamp IS NULL OR lure_expire_timestamp < UNIX_TIMESTAMP() OR ${excludeLureSQL})`;
            }
        } else if (!excludeNormal) {
            excludePokestopSQL = 'OR TRUE';
        }
    }

    if (showInvasions) {
        if (excludedInvasions.length === 0) {
            excludeInvasionSQL = 'OR (incident_expire_timestamp > UNIX_TIMESTAMP())';
        } else {
            let sqlExcludeCreate = 'OR (incident_expire_timestamp > UNIX_TIMESTAMP() AND grunt_type NOT IN (';
            for (let i = 0; i < excludedInvasions.length; i++) {
                if (i === excludedInvasions.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
                args.push(excludedInvasions[i]);
            }
            excludeInvasionSQL = sqlExcludeCreate;
        }
    }

    let sql = `
    SELECT id, lat, lon, name, url, enabled, lure_expire_timestamp, last_modified_timestamp, updated,
            quest_type, quest_timestamp, quest_target, CAST(quest_conditions AS CHAR) AS quest_conditions,
            CAST(quest_rewards AS CHAR) AS quest_rewards, quest_template, cell_id, lure_id, pokestop_display,
            incident_expire_timestamp, grunt_type, sponsor_id
    FROM pokestop
    WHERE lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? AND updated > ? AND deleted = false AND
        (false ${excludeTypeSQL} ${excludePokemonSQL} ${excludeEvolutionSQL} ${excludeItemSQL} ${excludePokestopSQL} ${excludeInvasionSQL})
    `;
    const results = await dbSelection('pokestop').query(sql, args);
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
                questConditions = result.quest_conditions ? JSON.parse(result.quest_conditions || []) : [];
                questRewards = result.quest_rewards ? JSON.parse(result.quest_rewards || []) : [];
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
};

const getSpawnpoints = async (minLat, maxLat, minLon, maxLon, updated, spawnpointFilterExclude = null) => {
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
    const results = await dbSelection('spawnpoint').query(sql, args);
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
};

const getDevices = async (deviceFilterExclude = null) => {
    let excludeOnline = false;
    let excludeOffline = false;
    if (deviceFilterExclude) {
        for (let i = 0; i < deviceFilterExclude.length; i++) {
            const filter = deviceFilterExclude[i];
            if (filter.includes('online')) {
                excludeOnline = true;
            } else if (filter.includes('offline')) {
                excludeOffline = true;
            }
        }
    }

    let excludeDeviceSQL;
    if (!excludeOnline && !excludeOffline) {
        excludeDeviceSQL = '';
    } else if (!excludeOnline && excludeOffline) {
        // Only exclude offline
        excludeDeviceSQL = 'AND (last_seen >= UNIX_TIMESTAMP(NOW() - INTERVAL 15 MINUTE))';
    } else if (excludeOnline && !excludeOffline) {
        // Only exclude online
        excludeDeviceSQL = 'AND (last_seen < UNIX_TIMESTAMP(NOW() - INTERVAL 15 MINUTE))';
    } else {
        excludeDeviceSQL = 'AND (last_seen >= UNIX_TIMESTAMP(NOW() - INTERVAL 15 MINUTE)) AND (last_seen < UNIX_TIMESTAMP(NOW() - INTERVAL 15 MINUTE))';
    }

    const sql = `
    SELECT uuid, instance_name, last_host, last_seen, account_username, last_lat, last_lon, type, data
    FROM device
    INNER JOIN instance
    ON device.instance_name = instance.name ${excludeDeviceSQL}
    `;
    const results = await dbSelection('device').query(sql);
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
                type: result.type,
                data: result.data
            });
        }
    }
    return devices;
};

const getS2Cells = async (minLat, maxLat, minLon, maxLon, updated) => {
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
    const results = await dbSelection('s2cell').query(sql, args);
    let cells = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            let polygon = getPolygon(result.id);
            cells.push({
                id: result.id,
                level: result.level,
                centerLat: result.center_lat,
                centerLon: result.center_lon,
                updated: result.updated,
                polygon: polygon
            });
        }
    }
    return cells;
};

const getSubmissionPlacementCells = async (minLat, maxLat, minLon, maxLon) => {
    let minLatReal = minLat - 0.001;
    let maxLatReal = maxLat + 0.001;
    let minLonReal = minLon - 0.001;
    let maxLonReal = maxLon + 0.001;

    let allStops = await getPokestops(minLatReal - 0.002, maxLatReal + 0.002, minLonReal - 0.002, maxLonReal + 0.002);
    allStops = allStops.filter(x => x.sponsor_id === null || x.sponsor_id === 0);
    let allGyms = await getGyms(minLatReal - 0.002, maxLatReal + 0.002, minLonReal - 0.002, maxLonReal + 0.002);
    allGyms = allGyms.filter(x => x.sponsor_id === null || x.sponsor_id === 0);
    let allStopCoods = allStops.map(x => { return { 'lat': x.lat, 'lon': x.lon }; });
    let allGymCoods = allGyms.map(x => { return { 'lat': x.lat, 'lon': x.lon }; });
    let allCoords = allGymCoods.concat(allStopCoods);

    let regionCoverer = new S2.S2RegionCoverer();
    regionCoverer.minLevel = 17;
    regionCoverer.maxLevel = 17;
    let region = S2.S2LatLngRect.fromLatLng(
        S2.S2LatLng.fromDegrees(minLatReal, minLonReal),
        S2.S2LatLng.fromDegrees(maxLatReal, maxLonReal)
    );
    let indexedCells = {};
    let coveringCells = regionCoverer.getCoveringCells(region);
    for (let i = 0; i < coveringCells.length; i++) {
        let cell = coveringCells[i];
        let polygon = getPolygon(cell.id);
        let cellId = BigInt(cell.id).toString();
        indexedCells[cellId] = {
            'id': cellId,
            'level': 17,
            'blocked': false,
            'polygon': polygon
        };
    }
    for (let i = 0; i < allCoords.length; i++) {
        let coord = allCoords[i];
        let level17Cell = S2.S2CellId.fromPoint(S2.S2LatLng.fromDegrees(coord.lat, coord.lon).toPoint()).parentL(17);
        let cellId = BigInt(level17Cell.id).toString();
        let cell = indexedCells[cellId];
        if (cell) {
            cell.blocked = true;
        }
    }
    let rings = allCoords.map(x => new Ring(x.lat, x.lon, 20));
    return {
        cells: Object.values(indexedCells),
        rings: rings
    };
};

const getSubmissionTypeCells = async (minLat, maxLat, minLon, maxLon) => {
    let minLatReal = minLat - 0.01;
    let maxLatReal = maxLat + 0.01;
    let minLonReal = minLon - 0.01;
    let maxLonReal = maxLon + 0.01;

    let allStops = await getPokestops(minLatReal - 0.02, maxLatReal + 0.02, minLonReal - 0.02, maxLonReal + 0.02);
    allStops = allStops.filter(x => x.sponsor_id === null || x.sponsor_id === 0);
    let allGyms = await getGyms(minLatReal - 0.02, maxLatReal + 0.02, minLonReal - 0.02, maxLonReal + 0.02);
    allGyms = allGyms.filter(x => x.sponsor_id === null || x.sponsor_id === 0);
    let allStopCoods = allStops.map(x => { return { 'lat': x.lat, 'lon': x.lon }; });
    let allGymCoods = allGyms.map(x => { return { 'lat': x.lat, 'lon': x.lon }; });

    let regionCoverer = new S2.S2RegionCoverer();
    regionCoverer.minLevel = 14;
    regionCoverer.maxLevel = 14;
    let region = S2.S2LatLngRect.fromLatLng(
        S2.S2LatLng.fromDegrees(minLatReal, minLonReal),
        S2.S2LatLng.fromDegrees(maxLatReal, maxLonReal)
    );
    let indexedCells = {};
    let coveringCells = regionCoverer.getCoveringCells(region);
    for (let i = 0; i < coveringCells.length; i++) {
        let cell = coveringCells[i];
        let polygon = getPolygon(cell.id);
        let cellId = BigInt(cell.id).toString();
        indexedCells[cellId] = {
            'id': cellId,
            'level': 14,
            'count': 0,
            'count_pokestops': 0,
            'count_gyms': 0,
            'polygon': polygon
        };
    }
    for (let i = 0; i < allGymCoods.length; i++) {
        let coord = allGymCoods[i];
        let level14Cell = S2.S2CellId.fromPoint(S2.S2LatLng.fromDegrees(coord.lat, coord.lon).toPoint()).parentL(14);
        let cellId = BigInt(level14Cell.id).toString();
        let cell = indexedCells[cellId];
        if (cell) {
            cell.count_gyms++;
            cell.count++;
        }
    }
    for (let i = 0; i < allStopCoods.length; i++) {
        let coord = allStopCoods[i];
        let level14Cell = S2.S2CellId.fromPoint(S2.S2LatLng.fromDegrees(coord.lat, coord.lon).toPoint()).parentL(14);
        let cellId = BigInt(level14Cell.id).toString();
        let cell = indexedCells[cellId];
        if (cell) {
            cell.count_pokestops++;
            cell.count++;
        }
    }
    return Object.values(indexedCells);
};

const getWeather = async (minLat, maxLat, minLon, maxLon, updated, weatherFilterExclude = null) => {
    const minLatReal = minLat - 0.1;
    const maxLatReal = maxLat + 0.1;
    const minLonReal = minLon - 0.1;
    const maxLonReal = maxLon + 0.1;
    let excludedTypes = [];
    if (weatherFilterExclude) {
        for (let i = 0; i < weatherFilterExclude.length; i++) {
            const filter = weatherFilterExclude[i];
            excludedTypes.push(filter);
        }
    }

    let excludeWeatherSQL = '';
    if (excludedTypes.length === 0) {
        excludeWeatherSQL = '';
    } else {
        let sqlExcludeCreate = 'AND (gameplay_condition NOT IN (';
        for (let i = 0; i < excludedTypes.length; i++) {
            if (i === excludedTypes.length - 1) {
                sqlExcludeCreate += '?))';
            } else {
                sqlExcludeCreate += '?, ';
            }
        }
        excludeWeatherSQL = sqlExcludeCreate;
    }

    const sql = `
    SELECT id, level, latitude, longitude, gameplay_condition, wind_direction, cloud_level,
            rain_level, wind_level, snow_level, fog_level, special_effect_level, severity, warn_weather, updated
    FROM weather
    WHERE latitude >= ? AND latitude <= ? AND longitude >= ? AND longitude <= ? AND updated > ? ${excludeWeatherSQL}
    `;
    const args = [minLatReal, maxLatReal, minLonReal, maxLonReal, updated];

    for (let i = 0; i < excludedTypes.length; i++) {
        const id = excludedTypes[i];
        args.push(id);
    }

    const results = await dbSelection('weather').query(sql, args);
    let weather = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const polygon = getPolygon(result.id);
            weather.push({
                id: result.id,
                level: result.level,
                latitude: result.latitude,
                longitude: result.longitude,
                polygon: polygon,
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
};

const getNests = async (minLat, maxLat, minLon, maxLon, nestFilterExclude = null) => {
    const minLatReal = minLat - 0.01;
    const maxLatReal = maxLat + 0.01;
    const minLonReal = minLon - 0.01;
    const maxLonReal = maxLon + 0.01;
    const excludedPokemon = [];
    let averageCountFilter = 0;

    if (nestFilterExclude) {
        for (let i = 0; i < nestFilterExclude.length; i++) {
            const filter = nestFilterExclude[i];
            if (filter.includes('p')) {
                const id = parseInt(filter.replace('p', ''));
                excludedPokemon.push(id);
            } else if (filter.includes('avg')) {
                averageCountFilter = filter.replace('avg', '');
            }
        }
    }

    let excludePokemonSQL;
    if (excludedPokemon.length === 0) {
        excludePokemonSQL = '';
    } else {
        let sqlExcludeCreate = 'AND (pokemon_id NOT IN (';
        for (let i = 0; i < excludedPokemon.length; i++) {
            if (i === excludedPokemon.length - 1) {
                sqlExcludeCreate += '?))';
            } else {
                sqlExcludeCreate += '?, ';
            }
        }
        excludePokemonSQL = sqlExcludeCreate;
    }

    let args = [minLatReal, maxLatReal, minLonReal, maxLonReal];

    let excludeAverageSQL;
    if (averageCountFilter >= 0) {
        // Minimum average count
        excludeAverageSQL = ' AND pokemon_avg >= ?';
        args.push(averageCountFilter);
    }

    const sql = `
    SELECT nest_id, lat, lon, name, pokemon_id, pokemon_count, pokemon_avg, updated
    FROM nests
    WHERE lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? ${excludeAverageSQL} ${excludePokemonSQL}
    `;
    for (let i = 0; i < excludedPokemon.length; i++) {
        args.push(excludedPokemon[i]);
    }

    const results = await dbSelection('nest').query(sql, args);
    if (results && results.length > 0) {
        return results;
    }
    return null;
};

const getPortals = async (minLat, maxLat, minLon, maxLon, portalFilterExclude = null) => {
    const minLatReal = minLat - 0.01;
    const maxLatReal = maxLat + 0.01;
    const minLonReal = minLon - 0.01;
    const maxLonReal = maxLon + 0.01;

    let showNewPortals = false;
    let showOldPortals = false;
    if (portalFilterExclude.length > 0) {
        showOldPortals = portalFilterExclude.includes('old');
        showNewPortals = portalFilterExclude.includes('new');
    }

    let sqlExcludeCreate = '';
    if (!showNewPortals && showOldPortals) {
        sqlExcludeCreate = 'AND imported < UNIX_TIMESTAMP(NOW() - INTERVAL 24 HOUR)';
    } else if (showNewPortals && !showOldPortals) {
        sqlExcludeCreate = 'AND imported >= UNIX_TIMESTAMP(NOW() - INTERVAL 24 HOUR)';
    } else if (!showNewPortals && !showOldPortals) {
        sqlExcludeCreate = 'AND FALSE';
    }

    const sql = `
    SELECT id, external_id, lat, lon, name, url, updated, imported, checked
    FROM ingress_portals
    WHERE lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? ${sqlExcludeCreate}
    `;
    const args = [minLatReal, maxLatReal, minLonReal, maxLonReal];
    const results = await dbSelection('portal').query(sql, args);
    if (results && results.length > 0) {
        return results;
    }
    return null;
};

/* eslint-disable no-case-declarations */
const getSearchData = async (lat, lon, id, value, iconStyle) => {
    let sql = '';
    let args = [lat, lon, lat];
    let useDb;
    let conditions = [];
    let sanitizedValue = sanitizer.sanitize(value);
    sanitizedValue = sanitizedValue.toLowerCase();
    switch (id) {
        case 'search-reward':
            let pokemonIds = getPokemonIdsByName(sanitizedValue);
            let pokemonRewardSQL = '';
            if (pokemonIds.length > 0) {
                // TODO: Search by form
                pokemonRewardSQL = 'quest_pokemon_id IN (';
                for (let i = 0; i < pokemonIds.length; i++) {
                    const pokemonId = pokemonIds[i];
                    pokemonRewardSQL += '?';
                    if (i !== pokemonIds.length - 1) {
                        pokemonRewardSQL += ',';
                    }
                    args.push(pokemonId);
                }
                pokemonRewardSQL += ')';
                conditions.push(pokemonRewardSQL);
            }
            let itemIds = getItemIdsByName(sanitizedValue);
            let itemsSQL = '';
            if (itemIds.length > 0) {
                itemsSQL = 'quest_item_id IN (';
                for (let i = 0; i < itemIds.length; i++) {
                    const id = itemIds[i];
                    itemsSQL += '?';
                    if (i !== itemIds.length - 1) {
                        itemsSQL += ',';
                    }
                    args.push(id);
                }
                itemsSQL += ')';
                conditions.push(itemsSQL);
            }
            let questTypes = getQuestTypesByName(sanitizedValue);
            let questTypesSQL = '';
            if (questTypes.length > 0) {
                questTypesSQL = 'quest_type IN (';
                for (let i = 0; i < questTypes.length; i++) {
                    const id = questTypes[i];
                    questTypesSQL += '?';
                    if (i !== questTypes.length - 1) {
                        questTypesSQL += ',';
                    }
                    args.push(id);
                }
                questTypesSQL += ')';
                conditions.push(questTypesSQL);
            }
            let questRewardTypes = getQuestRewardTypesByName(sanitizedValue);
            let questRewardTypesSQL = '';
            if (questRewardTypes.length > 0) {
                questRewardTypesSQL = 'quest_reward_type IN (';
                for (let i = 0; i < questRewardTypes.length; i++) {
                    const id = questRewardTypes[i];
                    questRewardTypesSQL += '?';
                    if (i !== questRewardTypes.length - 1) {
                        questRewardTypesSQL += ',';
                    }
                    args.push(id);
                }
                questRewardTypesSQL += ')';
                conditions.push(questRewardTypesSQL);
            }
            sql = `
            SELECT id, name, lat, lon, url, quest_type, quest_pokemon_id, quest_item_id, quest_reward_type,
                json_extract(json_extract(quest_rewards, '$[*].info.form_id'), '$[0]') AS quest_pokemon_form_id,
                ROUND(( 3959 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lon ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) ),2) AS distance
            FROM pokestop
            WHERE ${conditions.join(' OR ') || 'FALSE'}
            `;
            useDb = 'pokestop';
            break;
        case 'search-nest':
            let ids = getPokemonIdsByName(sanitizedValue);
            let pokemonSQL = '';
            if (ids.length > 0) {
                pokemonSQL = 'OR pokemon_id IN (';
                for (let i = 0; i < ids.length; i++) {
                    const nestPokemonId = ids[i];
                    pokemonSQL += '?';
                    if (i !== ids.length - 1) {
                        pokemonSQL += ',';
                    }
                    args.push(nestPokemonId);
                }
                pokemonSQL += ')';
            }
            sql = `
            SELECT name, lat, lon, pokemon_id,
                ROUND(( 3959 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lon ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) ),2) AS distance
            FROM nests
            WHERE LOWER(name) LIKE '%${sanitizedValue}%' ${pokemonSQL}
            `;
            useDb = 'nest';
            break;
        case 'search-portal':
            sql = `
            SELECT name, lat, lon, url, 
                ROUND(( 3959 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lon ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) ),2) AS distance
            FROM ingress_portals
            WHERE LOWER(name) LIKE '%${sanitizedValue}%'
            `;
            useDb = 'portal';
            break;
        case 'search-gym':
            sql = `
            SELECT id, name, lat, lon, url,
                ROUND(( 3959 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lon ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) ),2) AS distance
            FROM gym
            WHERE LOWER(name) LIKE '%${sanitizedValue}%'
            `;
            useDb = 'gym';
            break;
        case 'search-pokestop':
            sql = `
            SELECT id, name, lat, lon, url,
                ROUND(( 3959 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lon ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) ),2) AS distance
            FROM pokestop
            WHERE LOWER(name) LIKE '%${sanitizedValue}%'
            `;
            useDb = 'pokestop';
            break;
    }
    sql += ` ORDER BY distance LIMIT ${config.searchMaxResults || 20}`;
    let results = await dbSelection(useDb).query(sql, args);
    if (results && results.length > 0) {
        switch (id) {
            case 'search-reward':
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    // TODO: Check quest types
                    if (result.quest_item_id > 0) {
                        result.url2 = `/img/item/${result.quest_item_id}.png`;
                    } else if (result.quest_pokemon_id > 0) {
                        const formId = result.quest_pokemon_form_id > 0 ? '-f' + result.quest_pokemon_form_id : '';
                        result.url2 = config.icons[iconStyle].path + `/${result.quest_pokemon_id}${formId}.png`;
                    } else if (result.quest_reward_type === 3) {
                        result.url2 = '/img/item/-1.png';
                    }
                }
                break;
            case 'search-nest':
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    result.url = config.icons[iconStyle].path + `/${result.pokemon_id}.png`;
                }
                break;
        }
        return results;
    }
    return null;
};
/* eslint-enable no-case-declarations */

const getPolygon = (s2cellId) => {
    let s2cell = new S2.S2Cell(new S2.S2CellId(BigInt(s2cellId).toString()));
    let polygon = [];
    for (let i = 0; i <= 3; i++) {
        let coordinate = s2cell.getVertex(i);
        let point = new S2.S2Point(coordinate.x, coordinate.y, coordinate.z);
        let latlng = S2.S2LatLng.fromPoint(point);
        let latitude = latlng.latDegrees;
        let longitude = latlng.lngDegrees;
        polygon.push([
            latitude,
            longitude
        ]);
    }
    return polygon;
};

// need to keep consistency with client-side implementation checkIVFilterValid
const jsifyIvFilter = (filter) => {
    const input = filter.toUpperCase();
    let tokenizer = /\s*([()|&!,]|([ADSL]?|CP|[GU]L)\s*([0-9]+(?:\.[0-9]*)?)(?:\s*-\s*([0-9]+(?:\.[0-9]*)?))?)/g;
    let result = '';
    let expectClause = true;    // expect a clause or '('
    let stack = 0;
    let lastIndex = 0;
    let match;
    while ((match = tokenizer.exec(input)) !== null) {
        if (match.index > lastIndex) {
            return null;
        }
        if (expectClause) {
            if (match[3] !== undefined) {
                const lower = parseFloat(match[3]);
                let column = 'iv';
                switch (match[2]) {
                    case 'A': column = 'atk_iv'; break;
                    case 'D': column = 'def_iv'; break;
                    case 'S': column = 'sta_iv'; break;
                    case 'L': column = 'level';  break;
                    case 'CP': column = 'cp';    break;
                    case 'GL': column = 'pvp_rankings_great_league'; break;
                    case 'UL': column = 'pvp_rankings_ultra_league'; break;
                }
                let upper = lower;
                if (match[4] !== undefined) {
                    upper = parseFloat(match[4]);
                }
                if (column.endsWith('_league')) {
                    result += `((pokemon['${column}'] || []).some(x => x.rank >= ${lower} && x.rank <= ${upper}))`;
                } else {
                    result += `(pokemon['${column}'] !== null && pokemon['${column}'] >= ${lower} && pokemon['${column}'] <= ${upper})`;
                }
                expectClause = false;
            } else switch (match[1]) {
                case '(':
                    if (++stack > 1000000000) {
                        return null;
                    }
                    result += '(';
                    break;
                case '!':
                    result += '!';
                    break;
                default:
                    return null;
            }
        } else if (match[3] !== undefined) {
            return null;
        } else switch (match[1]) {
            case '(':
            case '!':
                return null;
            case ')':
                result += ')';
                if (--stack < 0) {
                    return null;
                }
                break;
            case '&':
                result += '&&';
                expectClause = true;
                break;
            case '|':
            case ',':
                result += '||';
                expectClause = true;
                break;
        }
        lastIndex = tokenizer.lastIndex;
    }
    if (expectClause || stack !== 0 || lastIndex < filter.length) {
        return null;
    }
    return requireFromString(`module.exports = (pokemon) => ${result};`);
};

const getAvailableRaidBosses = async () => {
    let sql = `
    SELECT raid_pokemon_id, raid_pokemon_form
    FROM gym
    WHERE raid_end_timestamp > UNIX_TIMESTAMP()
        AND raid_pokemon_id > 0
    GROUP BY raid_pokemon_id, raid_pokemon_form
    `;
    let result = await dbSelection('gym').query(sql);
    if (result) {
        return result.map(x => {
            return { id: x.raid_pokemon_id, form_id: x.raid_pokemon_form };
        });
    }
    return result;
};

const getAvailableQuests = async () => {
    let sql = 'SELECT quest_item_id AS id FROM pokestop WHERE quest_reward_type=2 GROUP BY quest_item_id';
    const itemResults = await dbSelection('pokestop').query(sql);
    sql = `SELECT DISTINCT
            quest_pokemon_id AS id,
            json_extract(json_extract(quest_rewards, '$[*].info.form_id'), '$[0]') AS form
        FROM pokestop WHERE quest_reward_type=7`;
    const pokemonResults = await dbSelection('pokestop').query(sql);
    sql = `
    SELECT
        DISTINCT json_extract(json_extract(quest_rewards, "$[*].info.pokemon_id"), "$[0]") AS id
    FROM pokestop
    WHERE quest_reward_type = 12
    `;
    const evoResults = await dbSelection('pokestop').query(sql);
    return {
        pokemon: pokemonResults,
        items: itemResults.map(x => x.id),
        evolutions: evoResults
    };
};

const getAvailableNestPokemon = async () => {
    const sql = `
    SELECT pokemon_id
    FROM nests
    GROUP BY pokemon_id
    `;
    let result = await dbSelection('nest').query(sql);
    if (result) {
        return result.map(x => x.pokemon_id);
    }
    return result;
};

const getPokemonIdsByName = (search) => {
    const pokemon = masterfile.pokemon;
    const keys = Object.keys(pokemon);
    const filtered = keys.filter(x => {
        if (x !== 0) {
            const name = i18n.__('poke_' + x) || '';
            if (name.toLowerCase().includes(search.toLowerCase())) {
                return x;
            }
        }
    });
    return filtered;
};

const getItemIdsByName = (search) => {
    const items = masterfile.items;
    const keys = Object.keys(items);
    const filtered = keys.filter(x => {
        const name = i18n.__('item_' + x) || '';
        if (name.toLowerCase().includes(search)) {
            return x;
        }
    });
    return filtered;
};

const getQuestTypesByName = (search) => {
    const questTypes = masterfile.quest_types;
    const keys = Object.keys(questTypes);
    const filtered = keys.filter(x => {
        const name = i18n.__('quest_' + x) || '';
        if (name.toLowerCase().includes(search)) {
            return x;
        }
    });
    return filtered;
};

const getQuestRewardTypesByName = (search) => {
    const questRewardTypes = masterfile.quest_reward_types;
    const keys = Object.keys(questRewardTypes);
    const filtered = keys.filter(x => {
        const name = i18n.__('quest_reward_' + x) || '';
        if (name.toLowerCase().includes(search)) {
            return x;
        }
    });
    return filtered;
};

class Ring {
    constructor(lat, lon, radius) {
        this.id = `${lat}-${lon}-${radius}`;
        this.lat = lat;
        this.lon = lon;
        this.radius = radius;
    }
}

module.exports = {
    getPokemon,
    getGyms,
    getPokestops,
    getSpawnpoints,
    getDevices,
    getS2Cells,
    getSubmissionPlacementCells,
    getSubmissionTypeCells,
    getWeather,
    getNests,
    getPortals,
    getSearchData,
    getAvailableRaidBosses,
    getAvailableQuests,
    getAvailableNestPokemon
};
