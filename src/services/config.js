'use strict';

const uConfig = require('../configs/config.json');
const eConfig = require('../configs/default.json');
const target = {
    ...eConfig,
    ...uConfig
};

module.exports = target;
