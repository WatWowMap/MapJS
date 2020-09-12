'use strict';

var jsonMerger = require("json-merger");
const uConfig = require('../config/configs.json');
const eConfig = require('../config/defaults.json');
var finalConfig = jsonMerger.mergeObjects([eConfig, uConfig]);

module.exports = finalConfig;
