'use strict';

var jsonMerger = require("json-merger");
const uConfig = require('../config/config.json');
const eConfig = require('../config/default.json');
var finalConfig = jsonMerger.mergeObjects([eConfig, uConfig]);

module.exports = finalConfig;
