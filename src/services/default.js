'use strict';

process.env['NODE_CONFIG_DIR'] = './src/config';
process.env.NODE_ENV = 'default.example';
process.env.HOST = 'default';
const config = require('config');
const finalDefault = config.get('advanced');

const uDefault = require('../config/default.json');
const eDefault = require('../config/default.example.json');
if (uDefault.version < eDefault.version) {
    console.log('Your default version is behind the latest, you may be missing some fancy new config features... loading defaults to fill them in for you.');
};

module.exports = finalDefault;
