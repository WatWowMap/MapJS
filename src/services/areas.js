'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../services/config.js');

const loadAreas = async () => {
    let areas = {};

    const areasFilePath = path.resolve('../../static/custom/areas.json');
    fs.readFile(areasFilePath, (err, data) => {
        if (err && config.discord.areaRestrictions) {
            console.warn('Area Restrictions Skipped - `config.discord.areaRestrictions` is not empty but `areas.json` file is missing.')
            return areas;
        }
        else if (!err) areas = JSON.parse(data);  // TODO: catch errors
    });
    return areas;
};

const parseAreas = async (areasObj) => {
    let polygons = {};

    for (const feature of areasObj.features) {
        // TODO: MultiPolygon support?
        if (feature.geometry.type == "Polygon" && feature.properties.name) {
            polygons[feature.properties.name] = [];
            for (const polygon_coordinates of feature.geometry.coordinates) polygons[feature.properties.name].push(...polygon_coordinates);
        }
    };
    return { Object.keys(polygons), polygons };
};

const raw = await loadAreas();  // areas.json object in unchanged form
const { names, polygons } = await parseAreas(raw);

module.exports = {
    raw,
    names,
    polygons
};
