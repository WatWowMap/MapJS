'use strict';

const S2 = require('nodes2ts');

const query = require('../services/db.js');

const getPokemon = async (minLat, maxLat, minLon, maxLon, showIV, updated, pokemonFilterExclude = null, pokemonFilterIV = null, pokemonFilterPVP = null) => {
    const excludePokemonIds = [];
    const excludeFormIds = [];
    let keys = Object.keys(pokemonFilterIV || []);
    if (keys && keys.length > 0 && showIV) {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const id = parseInt(key);
            if (id) {
                if (!pokemonFilterExclude.includes(id)) {
                    pokemonFilterExclude.push(id);
                }
            }
        }
    }

    keys = Object.values(pokemonFilterExclude || []);
    if (keys && keys.length > 0) {
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            //const id = parseInt(key);
            //if (id) {
                const split = key.split('-');
                if (split.length === 2) {
                    const pokemonId = parseInt(split[0]);
                    const formId = parseInt(split[1]);
                    excludePokemonIds.push(pokemonId);
                    excludeFormIds.push(formId);
                } else {
                    const id = parseInt(key);
                    if (id) {
                        //if (!pokemonFilterExclude.includes(id)) {
                        //    pokemonFilterExclude.push(id);
                        //}
                        if (!excludePokemonIds.includes(id)) {
                            excludePokemonIds.push(id);
                        }
                    }
                }
            //}
        }
    }

    const onlyBigKarp = pokemonFilterExclude.includes('big_karp');
    const onlyTinyRat = pokemonFilterExclude.includes('tiny_rat');

    let sqlExclude = '';
    if (onlyBigKarp || onlyTinyRat) {
        const karpBaseHeight = 0.89999998;
        const karpBaseWeight = 10;
        const bigKarpSQL = `(pokemon_id = 129 AND weight IS NOT NULL AND ((weight / ${karpBaseWeight}) + (size / ${karpBaseHeight})) > 2.5)`;
        const ratBaseHeight = 0.300000011920929;
        const ratBaseWeight = 3.5; //Alolan - 3.79999995231628
        const tinyRatSQL = `(pokemon_id = 19 AND weight IS NOT NULL AND ((weight / ${ratBaseWeight}) + (size / ${ratBaseHeight})) < 1.5)`;
        if (onlyBigKarp && onlyTinyRat) {
            sqlExclude = `(${bigKarpSQL} OR ${tinyRatSQL})`;
        } else if (onlyBigKarp && !onlyTinyRat) {
            sqlExclude = bigKarpSQL;
        } else if (!onlyBigKarp && onlyTinyRat) {
            sqlExclude = tinyRatSQL;
        } else {
            sqlExclude = '';
        }
    } else {
        //if (pokemonFilterExclude.length === 0) {
        if (excludePokemonIds.length === 0) {
            sqlExclude = '';
        } else {
            let sqlExcludeCreate = 'pokemon_id NOT IN (';
            //for (let i = 0; i < pokemonFilterExclude.length; i++) {
            for (let i = 0; i < excludePokemonIds.length; i++) {
                //if (i === pokemonFilterExclude.length - 1) {
                if (i === excludePokemonIds.length - 1) {
                    sqlExcludeCreate += '?)';
                } else {
                    sqlExcludeCreate += '?, ';
                }
            }
            sqlExclude = sqlExcludeCreate
        }

        if (excludeFormIds.length === 0) {
            sqlExclude = '';
        } else {
            let sqlExcludeCreate = 'form NOT IN (';
            for (let i = 0; i < excludeFormIds.length; i++) {
                if (i === excludeFormIds.length - 1) {
                    sqlExcludeCreate += '?)';
                } else {
                    sqlExcludeCreate += '?, ';
                }
            }
            sqlExclude += ' AND ' + sqlExcludeCreate;
        }
    }

    let sqlAdd = '';
    //if ((pokemonFilterIV === null || pokemonFilterIV.length === 0 || !showIV) && pokemonFilterExclude.length === 0) {
        if ((pokemonFilterIV === null || pokemonFilterIV.length === 0 || !showIV) && excludePokemonIds.length === 0) {
        sqlAdd = '';
    } else if (pokemonFilterIV === null || pokemonFilterIV.length === 0 || !showIV) {
        sqlAdd = ` AND ${sqlExclude}`;
    } else {
        let orPart = '';
        let andPart = '';
        const keys = Object.keys(pokemonFilterIV);
        keys.forEach(key => {
            const filter = pokemonFilterIV[key];
            const sql = sqlifyIvFilter(filter);
            if (sql && sql !== false && sql !== '') {
                if (key === 'and') {
                    andPart += sql;
                //} else if (pokemonFilterExclude && pokemonFilterExclude.length > 0) {
                } else if (excludePokemonIds && excludePokemonIds.length > 0) {
                    if (orPart === '') {
                        orPart += '(';
                    } else {
                        orPart += ' OR ';
                    }
                    if (key === 'or') {
                        orPart += `${sql}`;
                    } else {
                        const id = parseInt(key) || 0;
                        orPart += ` (pokemon_id = ${id} AND ${sql})`;
                    }
                } // TODO: form ids
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
            first_seen_timestamp, changed, cell_id, expire_timestamp_verified, shiny, username,
            capture_1, capture_2, capture_3, pvp_rankings_great_league, pvp_rankings_ultra_league
    FROM pokemon
    WHERE expire_timestamp >= UNIX_TIMESTAMP() AND lat >= ? AND lat <= ? AND lon >= ? AND
            lon <= ? AND updated > ? ${sqlAdd}
    `;
    let args = [minLat, maxLat, minLon, maxLon, updated];
    if (!(onlyBigKarp || onlyTinyRat)) {
        //for (let i = 0; i < pokemonFilterExclude.length; i++) {
        //    const id = pokemonFilterExclude[i];
        for (let i = 0; i < excludePokemonIds.length; i++) {
            const id = excludePokemonIds[i];
            //if (id !== 'big_karp' && id !== 'tiny_rat') {
                args.push(id);
            //}
        }
        for (let i = 0; i < excludeFormIds.length; i++) {
            args.push(excludeFormIds[i]);
        }
    }
    const results = await query(sql, args).catch(err => {
        console.error('Failed to execute query:', sql, 'with arguments:', args);
    });
    let pokemon = [];
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
            let pvpRankingsGreatLeague;
            let pvpRankingsUltraLeague;
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
                pvpRankingsGreatLeague = JSON.parse(result.pvp_rankings_great_league);
                pvpRankingsUltraLeague = JSON.parse(result.pvp_rankings_ultra_league);
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
                pvpRankingsGreatLeague = null;
                pvpRankingsUltraLeague = null;
            }

            let skip = false;
            if (pokemonFilterPVP) {
                let idString = pokemonFilterPVP.hasOwnProperty('and') ? 'and' : 'or';
                if (pokemonFilterPVP[idString]) {
                    let split = pokemonFilterPVP[idString].split('-');
                    if (split.length === 2) {
                        let minRank = parseInt(split[0]);
                        let maxRank = parseInt(split[1]);
                        if (
                            (pvpRankingsGreatLeague && pvpRankingsGreatLeague.length > 0) ||
                            (pvpRankingsUltraLeague && pvpRankingsUltraLeague.length > 0)
                        ) {
                            let greatLeague = pvpRankingsGreatLeague.filter(x => x.rank > 0 && x.rank >= minRank && x.rank <= maxRank && x.cp >= 1400 && x.cp <= 1500);
                            let ultraLeague = pvpRankingsUltraLeague.filter(x => x.rank > 0 && x.rank >= minRank && x.rank <= maxRank && x.cp >= 2400 && x.cp <= 2500);
                            if (greatLeague.length === 0 && ultraLeague.length === 0) {
                                skip = true;
                            }
                        } else {
                            skip = true;
                        }
                    }
                }
            }
            if (skip) {
                continue;
            }

            pokemon.push({
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
                expire_timestamp_verified: result.expire_timestamp_verified,
                capture_1: result.capture_1,
                capture_2: result.capture_2,
                capture_3: result.capture_3,
                pvp_rankings_great_league: pvpRankingsGreatLeague,
                pvp_rankings_ultra_league: pvpRankingsUltraLeague
            });
        }
    }
    return pokemon;
};

const getGyms = async (minLat, maxLat, minLon, maxLon, updated, raidsOnly, showRaids, raidFilterExclude = null, gymFilterExclude = null) => {
    let excludedLevels = []; //int
    let excludedPokemon = []; //int
    let excludeAllButEx = false;
    let excludeAllButBattles = false;
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

    let excludeLevelSQL = '';
    let excludePokemonSQL = '';
    let excludeAllButExSQL = '';
    let excludeAllButBattlesSQL = '';
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
            if (i === excludedAvailableSlots.length - 1) {
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

    if (excludeAllButBattles) {
        excludeAllButBattlesSQL = 'AND (in_battle = 1)';
    } else {
        excludeAllButBattlesSQL = '';
    }

    let sql = `
    SELECT id, lat, lon, name, url, guarding_pokemon_id, last_modified_timestamp, team_id, raid_end_timestamp,
            raid_spawn_timestamp, raid_battle_timestamp, raid_pokemon_id, enabled, availble_slots, updated,
            raid_level, ex_raid_eligible, in_battle, raid_pokemon_move_1, raid_pokemon_move_2, raid_pokemon_form,
            raid_pokemon_cp, raid_pokemon_gender, raid_is_exclusive, cell_id, total_cp, sponsor_id
    FROM gym
    WHERE lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? AND updated > ? AND deleted = false
        ${excludeLevelSQL} ${excludePokemonSQL} ${excludeTeamSQL} ${excludeAvailableSlotsSQL}
        ${excludeAllButExSQL} ${excludeAllButBattlesSQL}
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

    const results = await query(sql, args)
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
                sponsor_id: result.sponsor_id
            });
        }
    }
    return gyms;
};

const getPokestops = async (minLat, maxLat, minLon, maxLon, updated, showPokestops, showQuests, showLures, showInvasions, questFilterExclude = null, pokestopFilterExclude = null, invasionFilterExclude = null) => {
    let excludedTypes = []; //int
    let excludedPokemon = []; //int
    let excludedItems = []; //int
    let excludedLures = []; //int
    let excludedInvasions = [];
    let excludeNormal = false;

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

    let excludeTypeSQL = '';
    let excludePokemonSQL = '';
    let excludeItemSQL = '';
    let excludeLureSQL = '';
    let excludeInvasionSQL = '';
    let excludePokestopSQL = '';

    if (showQuests && (excludedTypes.length > 0 || excludedTypes.length > 0 || excludedPokemon.length > 0)) {
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
    }

    if (showPokestops && (excludeNormal || excludedLures.length > 0)) {
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

        if (excludeNormal) {
            excludePokestopSQL += `AND (lure_expire_timestamp IS NOT NULL AND lure_expire_timestamp >= UNIX_TIMESTAMP() ${excludeLureSQL})`;
        }
    }

    if (showInvasions && excludedInvasions) {
        if (excludedInvasions.length === 0) {
            excludeInvasionSQL = '';
        } else {
            let sqlExcludeCreate = (excludePokestopSQL !== '' || excludeTypeSQL !== '' || excludeItemSQL !== '' || excludePokemonSQL !== '' ? ' OR ' : ' AND ') + ' (incident_expire_timestamp > UNIX_TIMESTAMP() AND grunt_type NOT IN (';
            for (let i = 0; i < excludedInvasions.length; i++) {
                if (i === excludedInvasions.length - 1) {
                    sqlExcludeCreate += '?))';
                } else {
                    sqlExcludeCreate += '?, ';
                }
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
    WHERE lat >= ? AND lat <= ? AND lon >= ? AND lon <= ? AND updated > ? AND
        deleted = false ${excludeTypeSQL} ${excludePokemonSQL} ${excludeItemSQL} ${excludePokestopSQL} ${excludeInvasionSQL}
    `;

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
    for (let i = 0; i < excludedInvasions.length; i++) {
        args.push(excludedInvasions[i]);
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
};

const getDevices = async () => {
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
    const results = await query(sql, args);
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

    let allStops = await getPokestops(minLatReal - 0.002, maxLatReal + 0.002, minLonReal - 0.002, maxLonReal + 0.002, 0, true, false, false, false, null, null, null);
    allStops = allStops.filter(x => x.sponsor_id === null || x.sponsor_id === 0);
    let allGyms = await getGyms(minLatReal - 0.002, maxLatReal + 0.002, minLonReal - 0.002, maxLonReal + 0.002, 0, false, false, null, null);
    allGyms = allGyms.filter(x => x.sponsor_id === null || gym.sponsor_id === 0);
    let allStopCoods = allStops.map(x => { return { 'lat': x.lat, 'lon': x.lon } });
    let allGymCoods = allGyms.map(x => { return { 'lat': x.lat, 'lon': x.lon } });
    let allCoords = allGymCoods.concat(allStopCoods);

    let regionCoverer = new S2.S2RegionCoverer();
    regionCoverer.maxCells = 1000;
    regionCoverer.minLevel = 17;
    regionCoverer.maxLevel = 17;
    let region = S2.S2LatLngRect.fromLatLng(new S2.S2LatLng(minLatReal, minLonReal), new S2.S2LatLng(maxLatReal, maxLonReal));
    let indexedCells = {};
    let coveringCells = regionCoverer.getCoveringCells(region);
    for (let i = 0; i < coveringCells.length; i++) {
        let cell = coveringCells[i];
        let polygon = getPolygon(cell.id);
        let cellId = BigInt(cell.id).toString();
        indexedCells[cellId] = {
            "id": cellId,
            "level": 17,
            "blocked": false,
            "polygon": polygon
        }
    }
    for (let i = 0; i < allGymCoods.length; i++) {
        let coord = allGymCoods[i];
        let level1Cell = S2.S2Cell.fromLatLng(new S2.S2LatLng(coord));
        let regionCoverer = new S2.S2RegionCoverer();
        regionCoverer.minLevel = 17;
        regionCoverer.maxLevel = 17;
        regionCoverer.maxCells = 1;
        let region = level1Cell.getRectBound();
        let coveringCells = regionCoverer.getCoveringCells(region);
        let level17Cell = coveringCells[0];// TODO: .parent(17);
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

    let allStops = await getPokestops(minLatReal - 0.02, maxLatReal + 0.02, minLonReal - 0.02, maxLonReal + 0.02, 0, false, false, false, false, null, null);
    allStops = allStops.filter(x => x.sponsor_id === null || pokestop.sponsor_id === 0);
    let allGyms = await getGyms(minLatReal - 0.02, maxLatReal + 0.02, minLonReal - 0.02, maxLonReal + 0.02, 0, false, false, null, null);
    allGyms = allGyms.filter(x => x.sponsor_id === null || x.sponsor_id === 0);
    let allStopCoods = allStops.map(x => { return { 'lat': x.lat, 'lon': x.lon } });
    let allGymCoods = allGyms.map(x => { return { 'lat': x.lat, 'lon': x.lon } });

    let regionCoverer = new S2.S2RegionCoverer();
    regionCoverer.maxCells = 1000;
    regionCoverer.minLevel = 14;
    regionCoverer.maxLevel = 14;
    let region = S2.S2LatLngRect.fromLatLng(new S2.S2LatLng(minLatReal, minLonReal), new S2.S2LatLng(maxLatReal, maxLonReal));
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
        let level1Cell = S2.S2Cell.fromLatLng(new S2.S2LatLng(coord));
        let regionCoverer = new S2.S2RegionCoverer();
        regionCoverer.minLevel = 14;
        regionCoverer.maxLevel = 14;
        regionCoverer.maxCells = 1;
        let region = level1Cell.getRectBound();
        let coveringCells = regionCoverer.getCoveringCells(region);
        let level14Cell = coveringCells[0];// TODO: .parent(14);
        let cellId = BigInt(level14Cell.id).toString();
        let cell = indexedCells[cellId];
        if (cell) {
            cell.count_gyms++;
            cell.count++;
        }
    }
    for (let i = 0; i < allStopCoods.length; i++) {
        let coord = allStopCoods[i];
        let level1Cell = S2.S2Cell.fromLatLng(S2.S2LatLng.fromDegrees(coord.lat, coord.lon));
        let regionCoverer = new S2.S2RegionCoverer();
        regionCoverer.minLevel = 14;
        regionCoverer.maxLevel = 14;
        regionCoverer.maxCells = 1;
        let region = level1Cell.getRectBound();
        let coveringCells = regionCoverer.getCoveringCells(region);
        let level14Cell = coveringCells[0];// TODO: .parent(14);
        let cellId = BigInt(level14Cell.id).toString();
        let cell = indexedCells[cellId];
        if (cell) {
            cell.count_pokestops++;
            cell.count++;
        }
    }
    return Object.values(indexedCells);
}

const getWeather = async (minLat, maxLat, minLon, maxLon, updated) => {
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

const getPolygon = (s2cellId) => {
    let s2cell = new S2.S2Cell(new S2.S2CellId(BigInt(s2cellId).toString()));
    let polygon = [];
    for (let i = 0; i <= 3; i++) {
        let coordinate = s2cell.getVertex(i);
        let point = new S2.S2Point(coordinate.x, coordinate.y, coordinate.z);
        let latlng = S2.S2LatLng.fromPoint(point);
        let latitude = latlng.latDegrees
        let longitude = latlng.lngDegrees;
        polygon.push([
            latitude,
            longitude
        ]);
    }
    return polygon;
};

const sqlifyIvFilter = (filter) => {
    //let fullMatch = '^(?!&&|\\|\\|)((\\|\\||&&)?\\(?((A|D|S|L)?[0-9.]+(-(A|D|S|L)?[0-9.]+)?)\\)?)*$';
    /*
    if (filter !~ fullMatch) {
        return null;
    }
    */
    let singleMatch = '(A|D|S|L)?[0-9.]+(-(A|D|S|L)?[0-9.]+)?';
    let match = filter.match(singleMatch);
    let firstGroup = match[0];
    let firstGroupNumbers = firstGroup.replace('A', '');
    firstGroupNumbers = firstGroupNumbers.replace('D', '');
    firstGroupNumbers = firstGroupNumbers.replace('S', '');
    firstGroupNumbers = firstGroupNumbers.replace('L', '');

    let column = '';
    if (firstGroup.includes('A')) {
        column = 'atk_iv';
    } else if (firstGroup.includes('D')) {
        column = 'def_iv';
    } else if (firstGroup.includes('S')) {
        column = 'sta_iv';
    } else if (firstGroup.includes('L')) {
        column = 'level';
    } else {
        column = 'iv';
    }

    if (firstGroupNumbers.includes('-')) { // min max
        let split = firstGroupNumbers.split('-');
        if (split.length !== 2) { 
            return null;
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
    //sql = sql.replace("&&", " AND ");
    //sql = sql.replace("||", " OR ");
};

const getAvailableRaidBosses = async () => {
    let sql = `
    SELECT raid_pokemon_id
    FROM gym
    WHERE raid_end_timestamp > UNIX_TIMESTAMP()
        AND raid_pokemon_id > 0
    GROUP BY raid_pokemon_id
    `;
    let result = await query(sql);
    if (result) {
        return result.map(x => x.raid_pokemon_id);
    }
    return result;
};

const getAvailableQuests = async () => {
    //const rewards = ['stardust']; // TODO: Localize
    let sql = 'SELECT quest_item_id AS id FROM pokestop WHERE quest_reward_type=2 GROUP BY quest_item_id';
    const itemResults = await query(sql);
    sql = 'SELECT quest_pokemon_id AS id FROM pokestop WHERE quest_reward_type=7 GROUP BY quest_pokemon_id';
    const pokemonResults = await query(sql);
    return {
        pokemon: pokemonResults.map(x => x.id),
        items: itemResults.map(x => x.id)
    };
};

class Ring {
    id;
    lat;
    lon;
    radius;

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
    getAvailableRaidBosses,
    getAvailableQuests
};
