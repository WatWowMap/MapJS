'use strict';

const extend = require('extend');
const uConfig = require('../configs/config.json');
const dConfig = require('../configs/default.json');
/* 
 * deep Boolean (optional) If set, the merge becomes recursive (i.e. deep copy).
 * target Object The object to extend.
 * object1 Object The object that will be merged into the first.
 * objectN Object (Optional) More objects to merge into the first.
*/
extend(true, dConfig, uConfig);

module.exports = dConfig;
