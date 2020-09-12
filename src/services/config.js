'use strict';

process.env['NODE_CONFIG_DIR'] = './src/config';
process.env.NODE_ENV = 'config.example';
process.env.HOST = 'config';
const config = require('config');
const finalConfig = config.get('map');

const uConfig = require('../config/config.json');
const eConfig = require('../config/config.example.json');
if (uConfig.version < eConfig.version) {
    console.log('Your config version is behind the latest, you may be missing some fancy new config values... loading defaults to fill them in for you.');
};

module.exports = finalConfig;
