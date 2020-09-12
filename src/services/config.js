'use strict';

var jsonMerger = require("json-merger");
const uConfig = require('../configs/config.json');
const eConfig = require('../configs/default.json');
var finalConfig = jsonMerger.mergeObjects([eConfig, uConfig]);

module.exports = finalConfig;
