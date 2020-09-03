'use strict';

const config = require('../config.json');
const rarity = require('../rarity.json');
const data = require('../../static/locales/' + config.locale + '.json');
data.title = config.title;
data.header_title = config.headerTitle;
data.locale = config.locale;
data.style = config.style == 'dark' ? 'dark' : '';
data.max_pokemon_id = config.map.maxPokemonId; // TODO: Fix, no idea why index.js isn't picking up max_pokemon_id anymore
data.pokemon_count = config.map.maxPokemonId;
data.google_analytics_id = config.google.analytics;
data.google_adsense_id = config.google.adsense;
data.cluster_pokemon = config.map.clusters.pokemon;
data.cluster_gyms = config.map.clusters.gyms;
data.cluster_pokestops = config.map.clusters.pokestops;
data.cluster_zoom_level = config.map.clusters.zoomLevel;
data.scouting = config.scouting.enabled;
data.scouting_url = config.scouting.url;
data.scouting_count = config.scouting.maxScouts;
data.glow_color = config.map.glow.color;
data.glow_iv = config.map.glow.iv;

// Default filter options for new users/cache clears
data.default_show_pokemon = config.map.filters.pokemon;
data.default_show_raids = config.map.filters.raids;
data.default_show_gyms = config.map.filters.gyms;
data.default_show_pokestops = config.map.filters.pokestops;
data.default_show_quests = config.map.filters.quests;
data.default_show_invasions = config.map.filters.invasions;
data.default_show_spawnpoints = config.map.filters.spawnpoints;
data.default_show_weather = config.map.filters.weather;
data.default_show_scancells = config.map.filters.scanCells;
data.default_show_submissioncells = config.map.filters.submissionCells;
data.default_show_nests = config.map.filters.nests;
data.default_show_scanareas = config.map.filters.scanAreas;
data.default_show_devices = config.map.filters.devices;
data.pokemon_rarity_json = JSON.stringify(rarity);

module.exports = data;
