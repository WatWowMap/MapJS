'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const config = require('../config.json');
const defaultData = require('../data/default.js');
const InventoryItemId = require('../data/item.js');


router.get(['/', '/index'], function(req, res) {
    const data = handlePage(req, res);
    res.render('index', data);
});

router.get('/index.js', function(req, res) {
    res.setHeader('Content-Type', 'application/javascript');
    res.render('index-js', defaultData);
});

router.get('/index.css', function(req, res) {
    res.setHeader('Content-Type', 'text/css');
    res.render('index-css', defaultData);
});

router.get('/@/:lat/:lon', function(req, res) {
    const data = handlePage(req, res);
    res.render('index', data);
});

router.get('/@/:lat/:lon/:zoom', function(req, res) {
    const data = handlePage(req, res);
    res.render('index', data);
});

router.get('/@/:city', function(req, res) {
    const data = handlePage(req, res);
    res.render('index', data);
});

router.get('/@/:city/:zoom', function(req, res) {
    const data = handlePage(req, res);
    res.render('index', data);
});

function handlePage(req, res) {
    // Build available tile servers list
    const tileservers = {};
    const tileKeys = Object.keys(config.tileservers);
    if (tileKeys) {
        tileKeys.forEach(function(tileKey) {
            const tileData = config.tileservers[tileKey].split(';');
            tileservers[tileKey] = {
                url: tileData[0],
                attribution: tileData[1]
            };
        });
    }
    defaultData.avilable_tileservers_json = JSON.stringify(tileservers);

    // Build available forms list
    const availableForms = [];
    const pokemonIconsDir = path.resolve(__dirname, '../../static/img/pokemon');
    const files = fs.readdirSync(pokemonIconsDir);
    if (files) {
        files.forEach(function(file) {
            const split = file.replace('.png', '').split('-');
            if (split.length === 2) {
                const pokemonId = parseInt(split[0]);
                const formId = parseInt(split[1]);
                availableForms.push(`${pokemonId}-${formId}`);
            }
        });
    }
    defaultData.avilable_forms_json = JSON.stringify(availableForms);

    // Build available items list
    const availableItems = [-3, -2, -1];
    const keys = Object.keys(InventoryItemId);
    keys.forEach(function(key) {
        const itemId = InventoryItemId[key];
        availableItems.push(itemId);
    });
    defaultData.avilable_items_json = JSON.stringify(availableItems);    

    // Build available areas list
    const areas = [];
    const areaKeys = Object.keys(config.areas).sort();
    areaKeys.forEach(function(key) {
        const name = key[0].toUpperCase() + key.slice(1).toLowerCase();
        areas.push({ 'area': name });
    });
    defaultData.areas = areas;

    defaultData.page_is_home = true;
    defaultData.page_is_areas = true; // TODO: Perms
    defaultData.show_areas = true;

    defaultData.hide_gyms = false;
    defaultData.hide_pokestops = false;
    defaultData.hide_raids= false;
    defaultData.hide_pokemon = false;
    defaultData.hide_spawnpoints = false;
    defaultData.hide_quests = false;
    defaultData.hide_lures = false;
    defaultData.hide_invasions = false;
    defaultData.hide_cells = false;
    defaultData.hide_submission_cells = false;
    defaultData.hide_weathers = false;
    defaultData.hide_devices = false;

    let zoom = parseInt(req.params.zoom || config.startZoom);
    let lat = parseFloat(req.params.lat || config.startLat);
    let lon = parseFloat(req.params.lon || config.startLon);
    let city = req.params.city || null;
    // City but in wrong route
    // TODO: Fix city with zoom
    if (city === null) {
        //tmpCity.toDouble() == nil
        const tmpCity = req.params.lat;
        city = tmpCity;
        const tmpZoom = parseInt(req.params.lon);
        if (tmpZoom > 0) {
            zoom = tmpZoom;
        }
    }

    if (city) {
        for (var i = 0; i < areaKeys.length; i++) {
            const key = areaKeys[i];
            if (city.toLowerCase() === key.toLowerCase()) {
                const area = config.areas[key];
                lat = parseFloat(area.lat);
                lon = parseFloat(area.lon);
                if (zoom === null) {
                    zoom = parseInt(area.zoom || config.startZoom);
                }
            }
        }
    }

    if ((zoom || config.startZoom) > config.maxZoom) {
        zoom = config.maxZoom;
    } else if ((zoom || config.startZoom) < config.minZoom) {
        zoom = config.minZoom;
    }

    defaultData.start_lat = lat || 0;
    defaultData.start_lon = lon || 0;
    defaultData.start_zoom = zoom || config.startZoom || 12;
    defaultData.min_zoom = config.minZoom || 10;
    defaultData.max_zoom = config.maxZoom || 18;
    return defaultData;
}

module.exports = router;