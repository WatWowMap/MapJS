'use strict';

const config = require('../config.json');
const data = require('../../static/locales/' + config.locale + '.json');
data.title = config.title;
data.locale = config.locale;
data.style = config.style == 'dark' ? 'dark' : '';
data.max_pokemon_id = config.map.maxPokemonId;
data.google_analytics_id = config.google.analytics;
data.google_adsense_id = config.google.adsense;
data.cluster_pokemon = config.map.clusters.pokemon;

module.exports = data;