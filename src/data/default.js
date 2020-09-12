'use strict';

const config = require('../services/config.js');
const defaultConfig = require('../services/default.js');
const rarity = require('../config/rarity.json');
const data = require('../../static/locales/' + config.locale + '.json');

data.title = config.title;
data.header_title = config.headerTitle;
data.locale = config.locale;
data.max_pokemon_id = defaultConfig.maxPokemonId; // TODO: Fix, no idea why index.js isn't picking up max_pokemon_id anymore
data.pokemon_count = defaultConfig.maxPokemonId;
data.google_analytics_id = defaultConfig.google.analytics;
data.google_adsense_id = defaultConfig.google.adsense;
data.cluster_pokemon = defaultConfig.clusters.pokemon;
data.cluster_gyms = defaultConfig.clusters.gyms;
data.cluster_pokestops = defaultConfig.clusters.pokestops;
data.cluster_zoom_level = defaultConfig.clusters.zoomLevel;
data.scouting = defaultConfig.scouting.enabled;
data.scouting_url = defaultConfig.scouting.url;
data.scouting_count = defaultConfig.scouting.maxScouts;
data.glow_color = defaultConfig.glow.color;
data.glow_iv = defaultConfig.glow.iv;
data.device_path_color = defaultConfig.devicePathColor;

// Default filter options for new users/cache clears
data.default_show_pokemon = defaultConfig.filters.pokemon;
data.default_show_raids = defaultConfig.filters.raids;
data.default_show_raid_timers = defaultConfig.filters.raidTimers;
data.default_show_gyms = defaultConfig.filters.gyms;
data.default_show_pokestops = defaultConfig.filters.pokestops;
data.default_show_quests = defaultConfig.filters.quests;
data.default_show_invasions = defaultConfig.filters.invasions;
data.default_show_invasion_timers = defaultConfig.filters.invasionTimers;
data.default_show_spawnpoints = defaultConfig.filters.spawnpoints;
data.default_show_weather = defaultConfig.filters.weather;
data.default_show_scan_cells = defaultConfig.filters.scanCells;
data.default_show_submission_cells = defaultConfig.filters.submissionCells;
data.default_show_nests = defaultConfig.filters.nests;
data.default_show_scan_areas = defaultConfig.filters.scanAreas;
data.default_show_devices = defaultConfig.filters.devices;
data.pokemon_rarity_json = JSON.stringify(rarity);

module.exports = data;
