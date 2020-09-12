'use strict';

process.env['NODE_CONFIG_DIR'] = './src';
process.env.NODE_ENV = "config.example";
process.env.HOST = 'config';

const config = require('config');
const uConfig = require('../config');
const eConfig = require('../config.example.json');
const finalConfig = config.get('map');

if (uConfig.version < eConfig.version) {
    console.log('Your config version is behind the latest, you may be missing some fancy new config values... loading defaults to fill them in for you.');
};

module.exports = finalConfig;
