'use strict';

const config = require('../services/config.js');
const rarity = require('../rarity.json');
const data = require('../../static/locales/' + config.locale + '.json');
data.title = config.title;
data.header_title = config.headerTitle;
data.locale = config.locale;
data.max_pokemon_id = config.default.maxPokemonId; // TODO: Fix, no idea why index.js isn't picking up max_pokemon_id anymore
data.pokemon_count = config.default.maxPokemonId;
data.google_analytics_id = config.google.analytics;
data.google_adsense_id = config.google.adsense;
data.cluster_pokemon = config.default.clusters.pokemon;
data.cluster_gyms = config.default.clusters.gyms;
data.cluster_pokestops = config.default.clusters.pokestops;
data.cluster_zoom_level = config.default.clusters.zoomLevel;
data.scouting = config.scouting.enabled;
data.scouting_url = config.scouting.url;
data.scouting_count = config.scouting.maxScouts;
data.glow_color = config.default.glow.color;
data.glow_iv = config.default.glow.iv;
data.device_path_color = config.default.devicePathColor;

// Default filter options for new users/cache clears
data.default_show_pokemon = config.default.filters.pokemon;
data.default_show_raids = config.default.filters.raids;
data.default_show_raid_timers = config.default.filters.raidTimers;
data.default_show_gyms = config.default.filters.gyms;
data.default_show_pokestops = config.default.filters.pokestops;
data.default_show_quests = config.default.filters.quests;
data.default_show_invasions = config.default.filters.invasions;
data.default_show_invasion_timers = config.default.filters.invasionTimers;
data.default_show_spawnpoints = config.default.filters.spawnpoints;
data.default_show_weather = config.default.filters.weather;
data.default_show_scan_cells = config.default.filters.scanCells;
data.default_show_submission_cells = config.default.filters.submissionCells;
data.default_show_nests = config.default.filters.nests;
data.default_show_scan_areas = config.default.filters.scanAreas;
data.default_show_devices = config.default.filters.devices;
data.pokemon_rarity_json = JSON.stringify(rarity);

module.exports = data;
