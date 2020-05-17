'use strict';

const query = require('../services/db.js');

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
    getPokemon,
    getGyms,
    getPokestops,
    getSpawnpoints,
    getDevices,
    getS2Cells,
    getWeather
};