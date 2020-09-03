/* global BigInt */
'use strict';

const i18n = require('i18n');
const S2 = require('nodes2ts');
const sanitizer = require('sanitizer');

const config = require('../config.json');
const MySQLConnector = require('../services/mysql.js');
const utils = require('../services/utils.js');

const db = new MySQLConnector(config.db.scanner);
const dbManual = new MySQLConnector(config.db.manualdb);

const masterfile = require('../../static/data/masterfile.json');


const getPokemon = async (minLat, maxLat, minLon, maxLon, showPVP, showIV, updated, pokemonFilterExclude = null, pokemonFilterIV = null, pokemonFilterPVP = null) => {
    const excludePokemonIds = [];
    const excludeFormIds = [];
    let keys = Object.keys(pokemonFilterIV || []);
    if (keys && keys.length > 0 && showIV) {
        for (let i = 0; i < keys.length; i++) {
            const id = keys[i];
            if (id) {
                if (!pokemonFilterExclude.includes(id)) {
                    pokemonFilterExclude.push(id);
                }
            }
        }
    }

    keys = Object.values(pokemonFilterExclude || []);
    let sqlIncludeBigKarp = '';
    let sqlIncludeTinyRat = '';
    if (keys && keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const split = key.split('-', 2);
            if (split.length === 2) {
                const pokemonId = parseInt(split[0]);
                const formId = parseInt(split[1]);
                if ((masterfile.pokemon[pokemonId] || {}).default_form_id === split[1]) {
                    excludePokemonIds.push(pokemonId);
                }
                excludeFormIds.push(formId);
            } else {
                const id = parseInt(key);
                if (id) {
                    if (!excludePokemonIds.includes(id)) {
                        excludePokemonIds.push(id);
                    }
                } else if (key === 'big_karp') {
                    sqlIncludeBigKarp = 'OR (pokemon_id = 129 AND weight IS NOT NULL AND weight >= 13.125)';
                } else if (key === 'tiny_rat') {
                    sqlIncludeTinyRat = 'OR (pokemon_id = 19 AND weight IS NOT NULL AND weight <= 2.40625)';
                }
            }
        }
    }

    let args = [minLat, maxLat, minLon, maxLon, updated];

    let sqlExcludePokemon = '';
    if (excludePokemonIds.length > 0) {
        let sqlExcludeCreate = 'AND pokemon_id NOT IN (';
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

    let sqlExcludeForms = '';
    for (let i = 0; i < excludeFormIds.length; i++) {
        sqlExcludeForms += ', ?';
        args.push(excludeFormIds[i]);
    }

    let sqlIncludeIv = '';
    let sqlOrIv = '';
    let sqlAndIv = '';
    if (showIV) {
        const keys = Object.keys(pokemonFilterIV);
        keys.forEach(key => {
            const filter = pokemonFilterIV[key];
            const sqlFilter = sqlifyIvFilter(filter);
            if (sqlFilter) {
                const split = key.split('-', 2);
                let sqlPokemon = 'FALSE';
                if (split.length === 2) {
                    const pokemonId = parseInt(split[0]);
                    const formId = parseInt(split[1]);
                    sqlPokemon = `form = ${formId}`;
                    if ((masterfile.pokemon[pokemonId] || {}).default_form_id === split[1]) {
                        sqlPokemon += ` OR pokemon_id = ${pokemonId} AND form = 0`;
                    }
                } else if (key === 'and') {
                    sqlAndIv = `AND (${sqlFilter})`;
                    return;
                } else if (key === 'or') {
                    sqlOrIv = `OR (${sqlFilter})`;
                    return;
                } else {
                    const id = parseInt(key);
                    if (id) {
                        sqlPokemon = `pokemon_id = ${id} AND form = 0`;
                    }
                }
                sqlIncludeIv += ` OR ((${sqlPokemon}) AND (${sqlFilter}))`;
            }
        });
    }

    const sql = `
    SELECT id, pokemon_id, lat, lon, spawn_id, expire_timestamp, atk_iv, def_iv, sta_iv, move_1, move_2,
            gender, form, cp, level, weather, costume, weight, size, display_pokemon_id, pokestop_id, updated,
            first_seen_timestamp, changed, cell_id, expire_timestamp_verified, shiny, username,
            capture_1, capture_2, capture_3, pvp_rankings_great_league, pvp_rankings_ultra_league
    FROM pokemon
    WHERE expire_timestamp >= UNIX_TIMESTAMP() AND lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? AND updated > ? AND (
        (
            (form = 0 ${sqlExcludePokemon})
            OR form NOT IN (0 ${sqlExcludeForms})
            ${sqlIncludeIv} ${sqlIncludeBigKarp} ${sqlIncludeTinyRat}
        ) ${sqlAndIv} ${sqlOrIv}
    )`;
    const results = await db.query(sql, args).catch(err => {
        console.error('Failed to execute query:', sql, 'with arguments:', args, '\r\n:Error:', err);
    });
    let pokemon = [];
    if (results && results.length > 0) {
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            let filtered = {
                id: result.id,
                pokemon_id: result.pokemon_id,
                lat: result.lat,
                lon: result.lon,
                spawn_id: result.spawn_id,
                expire_timestamp: result.expire_timestamp,
                gender: result.gender,
                form: result.form,
                costume: result.costume,
                weather: result.weather,
                shiny: result.shiny,
                username: result.username,
                pokestop_id: result.pokestop_id,
                first_seen_timestamp: result.first_seen_timestamp,
                updated: result.updated,
                changed: result.changed,
                cellId: result.cell_id,
                expire_timestamp_verified: result.expire_timestamp_verified,
                capture_1: result.capture_1,
                capture_2: result.capture_2,
                capture_3: result.capture_3,
            };
            if (showIV) {
                filtered.atk_iv = result.atk_iv;
                filtered.def_iv = result.def_iv;
                filtered.sta_iv = result.sta_iv;
                filtered.move_1 = result.move_1;
                filtered.move_2 = result.move_2;
                filtered.cp = result.cp;
                filtered.level = result.level;
                filtered.weight = result.weight;
                filtered.size = result.size;
                filtered.display_pokemon_id = result.display_pokemon_id;
            }
            if (showPVP) {
                filtered.pvp_rankings_great_league = JSON.parse(result.pvp_rankings_great_league);
                filtered.pvp_rankings_ultra_league = JSON.parse(result.pvp_rankings_ultra_league);
                if (pokemonFilterPVP) {
                    let idString = pokemonFilterPVP['and'] ? 'and' : 'or';
                    if (pokemonFilterPVP[idString]) {
                        let split = String(pokemonFilterPVP[idString]).split('-', 2);
                        if (split.length === 2) {
                            let minRank = parseInt(split[0]);
                            let maxRank = parseInt(split[1]);
                            if (
                                (!filtered.pvp_rankings_great_league || filtered.pvp_rankings_great_league.length === 0) &&
                                (!filtered.pvp_rankings_ultra_league || filtered.pvp_rankings_ultra_league.length === 0)
                            ) {
                                continue;
                            }
                            let greatLeague = filtered.pvp_rankings_great_league.filter(x => x.rank > 0 && x.rank >= minRank && x.rank <= maxRank && x.cp >= 1400 && x.cp <= 1500);
                            let ultraLeague = filtered.pvp_rankings_ultra_league.filter(x => x.rank > 0 && x.rank >= minRank && x.rank <= maxRank && x.cp >= 2400 && x.cp <= 2500);
                            if (greatLeague.length === 0 && ultraLeague.length === 0) {
                                continue;
                            }
                        }
                    }
                }
            }
            pokemon.push(filtered);
        }
    }
    return pokemon;
};

const getGyms = async (minLat, maxLat, minLon, maxLon, updated = 0, showRaids = false, showGyms = true, raidFilterExclude = null, gymFilterExclude = null) => {
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
                        if ((masterfile.pokemon[pokemonId] || {}).default_form_id === split[1]) {
                            excludePokemonIds.push(pokemonId);
                        }
                    }
                } else {
                    const id = parseInt(key);
                    if (id) {
                        if (!excludePokemonIds.includes(id)) {
                            excludePokemonIds.push(id);
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
            let sqlExcludeCreate = 'AND (raid_end_timestamp IS NULL OR raid_end_timestamp < UNIX_TIMESTAMP() OR raid_pokemon_id > 0 OR raid_level NOT IN (';
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
            raid_end_timestamp IS NULL OR raid_end_timestamp < UNIX_TIMESTAMP() OR 
            (raid_pokemon_form = 0 ${sqlExcludePokemon}) OR raid_pokemon_form NOT IN (0 ${sqlExcludeForms})
        ) ${excludeTeamSQL} ${excludeAvailableSlotsSQL}
        ${excludeAllButExSQL} ${excludeAllButBattlesSQL}
    `;
    if (!showGyms) {
        sql += ' AND raid_end_timestamp IS NOT NULL AND raid_end_timestamp >= UNIX_TIMESTAMP()';
    }

    const results = await db.query(sql, args)
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
                raid_pokemon_move_1: result.raid_pokemon_move_1,
                raid_pokemon_move_2: result.raid_pokemon_move_2,
                raid_pokemon_form: result.raid_pokemon_form,
                raid_pokemon_cp: result.raid_pokemon_cp,
                raid_pokemon_gender: result.raid_pokemon_gender,
                raid_is_exclusive: result.raid_is_exclusive,
                cell_id: result.cell_id,
                total_cp: result.total_cp,
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
    let excludedItems = []; //int
    let excludedLures = []; //int
    let excludedInvasions = [];
    let excludeNormal = false;
    let minimumCandyCount = 0;
    let minimumStardustCount = 0;

    if (showQuests && questFilterExclude) {
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
    let excludeItemSQL = '';
    let excludeInvasionSQL = '';
    let excludePokestopSQL = '';

    if (showQuests) {
        if (excludedTypes.length === 0) {
            // exclude pokemon/item quests; they will be included in subsequent clauses
            excludeTypeSQL = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type NOT IN (2, 7))';
        } else {
            let sqlExcludeCreate = 'OR ((quest_reward_type IS NOT NULL AND quest_reward_type NOT IN (2, 7, ';
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
            if (minimumStardustCount > 0) {
                excludeTypeSQL += ' AND (quest_reward_type <> 3 OR JSON_VALUE(quest_rewards, "$[0].info.amount") >= ?)';
                args.push(minimumStardustCount);
            }
            excludeTypeSQL += ')';
        }

        if (excludedPokemon.length === 0) {
            excludePokemonSQL = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type = 7 AND quest_pokemon_id IS NOT NULL)';
        } else {
            let sqlExcludeCreate = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type = 7 AND quest_pokemon_id IS NOT NULL AND quest_pokemon_id NOT IN (';
            for (let i = 0; i < excludedPokemon.length; i++) {
                if (i === excludedPokemon.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
                const id = parseInt(excludedPokemon[i]);
                args.push(id);
            }
            excludePokemonSQL = sqlExcludeCreate;
        }

        if (excludedItems.length === 0) {
            excludeItemSQL = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type = 3 AND quest_item_id IS NOT NULL)';
        } else {
            excludeItemSQL = 'OR (quest_reward_type IS NOT NULL AND quest_reward_type = 3 AND quest_item_id IS NOT NULL AND quest_item_id NOT IN (';
            for (let i = 0; i < excludedItems.length; i++) {
                if (i === excludedItems.length - 1) {
                    excludeItemSQL += '?)';
                } else {
                    excludeItemSQL += '?, ';
                }
                args.push(excludedItems[i]);
            }
            if (minimumCandyCount > 0) {
                excludeItemSQL += ' AND (quest_item_id <> 1301 OR JSON_VALUE(quest_rewards, "$[0].info.amount") >= ?)';
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
        (false ${excludeTypeSQL} ${excludePokemonSQL} ${excludeItemSQL} ${excludePokestopSQL} ${excludeInvasionSQL})
    `;
    const results = await db.query(sql, args);
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
    const results = await db.query(sql, args);
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
    const results = await db.query(sql);
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
    const results = await db.query(sql, args);
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

    const results = await db.query(sql, args);
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

    const results = await dbManual.query(sql, args);
    if (results && results.length > 0) {
        return results;
    }
    return null;
};

const getSearchData = async (lat, lon, id, value) => {
    let sql = '';
    let args = [lat, lon, lat];
    let useManualDb = false;
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
                JSON_VALUE(quest_rewards, '$[*].info.form_id') AS quest_pokemon_form_id,
                ROUND(( 3959 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lon ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) ),2) AS distance
            FROM pokestop
            WHERE ${conditions.join(' OR ') || 'FALSE'}
            `;
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
            useManualDb = true;
            break;
        case 'search-gym':
            sql = `
            SELECT id, name, lat, lon, url,
                ROUND(( 3959 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lon ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) ),2) AS distance
            FROM gym
            WHERE LOWER(name) LIKE '%${sanitizedValue}%'
            `;
            break;
        case 'search-pokestop':
            sql = `
            SELECT id, name, lat, lon, url,
                ROUND(( 3959 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lon ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) ),2) AS distance
            FROM pokestop
            WHERE LOWER(name) LIKE '%${sanitizedValue}%'
            `;
            break;
    }
    sql += ` ORDER BY distance LIMIT ${config.searchMaxResults || 20}`;
    let results = useManualDb
        ? await dbManual.query(sql, args)
        : await db.query(sql, args);
    if (results && results.length > 0) {
        switch (id) {
            case 'search-reward':
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    // TODO: Check quest types
                    if (result.quest_item_id > 0) {
                        result.url2 = config.icons['Default'/* TODO: Add icon style */].path + `/item/${result.quest_item_id}.png`;
                    } else if (result.quest_pokemon_id > 0) {
                        const formId = result.quest_pokemon_form_id > 0 ? result.quest_pokemon_form_id : '00';
                        result.url2 = config.icons['Default'/* TODO: Add icon style */].path + `/pokemon/pokemon_icon_${utils.zeroPad(result.quest_pokemon_id, 3)}_${formId}.png`;
                    } else if (result.quest_reward_type === 3) {
                        result.url2 = config.icons['Default'/* TODO: Add icon style */].path + '/item/-1.png';
                    }
                }
                break;
            case 'search-nest':
                for (let i = 0; i < results.length; i++) {
                    let result = results[i];
                    result.url = config.icons['Default'/* TODO: Add icon style */].path + `/pokemon/pokemon_icon_${utils.zeroPad(result.pokemon_id, 3)}_00.png`;
                }
                break;
        }
        return results;
    }
    return null;
};

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

const sqlifyIvFilter = (filter) => {
    let tokenizer = /\s*([()|&]|([ADSL]?)([0-9]+(?:\.[0-9]*)?)(?:-([0-9]+(?:\.[0-9]*)?))?)/g;
    let result = '';
    let expectClause = true;    // expect a clause or '('
    let stack = 0;
    let lastIndex = 0;
    let match;
    while ((match = tokenizer.exec(filter)) !== null) {
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
                }
                let higher = lower;
                if (match[4] !== undefined) {
                    higher = parseFloat(match[4]);
                }
                result += `(${column} IS NOT NULL AND ${column} >= ${lower} AND ${column} <= ${higher})`;
                expectClause = false;
            } else if (match[1] === '(') {
                if (++stack > 1000000000) {
                    return null;
                }
                result += '(';
            } else {
                return null;
            }
        } else if (match[3] !== undefined) {
            return null;
        } else switch (match[1]) {
            case '(': return null;
            case ')':
                result += ')';
                if (--stack < 0) {
                    return null;
                }
                break;
            case '&':
                result += 'AND';
                expectClause = true;
                break;
            case '|':
                result += 'OR';
                expectClause = true;
                break;
        }
        lastIndex = tokenizer.lastIndex;
    }
    if (expectClause || stack !== 0 || lastIndex < filter.length) {
        return null;
    }
    return result;
};

const getAvailableRaidBosses = async () => {
    let sql = `
    SELECT raid_pokemon_id, raid_pokemon_form
    FROM gym
    WHERE raid_end_timestamp > UNIX_TIMESTAMP()
        AND raid_pokemon_id > 0
    GROUP BY raid_pokemon_id, raid_pokemon_form
    `;
    let result = await db.query(sql);
    if (result) {
        return result.map(x => {
            return { id: x.raid_pokemon_id, form_id: x.raid_pokemon_form };
        });
    }
    return result;
};

const getAvailableQuests = async () => {
    //const rewards = ['stardust']; // TODO: Localize
    let sql = 'SELECT quest_item_id AS id FROM pokestop WHERE quest_reward_type=2 GROUP BY quest_item_id';
    const itemResults = await db.query(sql);
    sql = 'SELECT quest_pokemon_id AS id FROM pokestop WHERE quest_reward_type=7 GROUP BY quest_pokemon_id';
    const pokemonResults = await db.query(sql);
    return {
        pokemon: pokemonResults.map(x => x.id),
        items: itemResults.map(x => x.id)
    };
};

const getAvailableNestPokemon = async () => {
    const sql = `
    SELECT pokemon_id
    FROM nests
    GROUP BY pokemon_id
    `;
    let result = await dbManual.query(sql);
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
    getSearchData,
    getAvailableRaidBosses,
    getAvailableQuests,
    getAvailableNestPokemon
};
