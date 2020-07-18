'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const config = require('../config.json');
const defaultData = require('../data/default.js');
const InventoryItemId = require('../data/item.js');
const utils = require('../services/utils.js');

if (config.discord.enabled) {
    router.get('/login', (req, res) => {
        res.redirect('/api/discord/login');
    });

    router.get('/logout', (req, res) => {
        req.session.destroy((err) => {
            if (err) throw err;
            res.redirect('/login');
        });
    });
}

router.get(['/', '/index'], (req, res) => {
    const data = handlePage(req, res);
    res.render('index', data);
});

router.get('/index.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.render('index-js', defaultData);
});

router.get('/index.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.render('index-css', defaultData);
});

router.get('/@/:lat/:lon', (req, res) => {
    const data = handlePage(req, res);
    res.render('index', data);
});

router.get('/@/:lat/:lon/:zoom', (req, res) => {
    const data = handlePage(req, res);
    res.render('index', data);
});

router.get('/@/:city', (req, res) => {
    const data = handlePage(req, res);
    res.render('index', data);
});

router.get('/@/:city/:zoom', (req, res) => {
    const data = handlePage(req, res);
    res.render('index', data);
});

const handlePage = (req, res) => {
    // Build available tile servers list
    const tileservers = {};
    const tileKeys = Object.keys(config.tileservers);
    if (tileKeys) {
        tileKeys.forEach(tileKey => {
            const tileData = config.tileservers[tileKey].split(';');
            tileservers[tileKey] = {
                url: tileData[0],
                attribution: tileData[1]
            };
        });
    }
    defaultData.available_tileservers_json = JSON.stringify(tileservers);

    // Build available forms list
    const availableForms = [];
    const pokemonIconsDir = path.resolve(__dirname, '../../static/img/pokemon');
    const files = fs.readdirSync(pokemonIconsDir);
    if (files) {
        files.forEach(file => {
            const split = file.replace('.png', '').split('-');
            if (split.length === 2) {
                const pokemonId = parseInt(split[0]);
                const formId = parseInt(split[1]);
                availableForms.push(`${pokemonId}-${formId}`);
            }
        });
    }
    defaultData.available_forms_json = JSON.stringify(availableForms);

    // Build available items list
    const availableItems = [-3, -2, -1];
    const keys = Object.keys(InventoryItemId);
    keys.forEach(key => {
        const itemId = InventoryItemId[key];
        availableItems.push(itemId);
    });
    defaultData.available_items_json = JSON.stringify(availableItems);    

    // Build available areas list
    const areas = [];
    const areaKeys = Object.keys(config.areas).sort();
    areaKeys.forEach(key => {
        areas.push({ 'area': key });
    });
    defaultData.areas = areas;

    if (!config.discord.enabled || req.session.logged_in) {
        defaultData.logged_in = true;
        defaultData.username = req.session.username;
        if (req.session.valid) {
            defaultData.page_is_home = true;
            defaultData.page_is_areas = true;
            defaultData.show_areas = true;
            const perms = req.session.perms;
            defaultData.hide_map = !perms.map;
            defaultData.hide_pokemon = !perms.pokemon;
            defaultData.hide_raids = !perms.raids;
            defaultData.hide_gyms = !perms.gyms;
            defaultData.hide_pokestops = !perms.pokestops;
            defaultData.hide_quests = !perms.quests;
            defaultData.hide_lures = !perms.lures;
            defaultData.hide_invasions = !perms.invasions;
            defaultData.hide_spawnpoints = !perms.spawnpoints;
            defaultData.hide_iv = !perms.iv;
            defaultData.hide_s2cells = !perms.s2cells;
            defaultData.hide_submissionCells = !perms.submissionCells;
            defaultData.hide_nests = !perms.nests;
            defaultData.hide_weather = !perms.weather;
            defaultData.hide_devices = !perms.devices;
        }
    }

    let lat = parseFloat(req.params.lat || config.map.startLat);
    let lon = parseFloat(req.params.lon || config.map.startLon);
    let city = req.params.city || null;
    let zoom = parseInt(req.params.zoom || config.map.startZoom);

    // City specified but in wrong route
    if (city === null) {
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
                    zoom = parseInt(area.zoom || config.map.startZoom);
                }
            }
        }
    }

    if ((zoom || config.map.startZoom) > config.map.maxZoom) {
        zoom = config.map.maxZoom;
    } else if ((zoom || config.map.startZoom) < config.map.minZoom) {
        zoom = config.map.minZoom;
    }

    defaultData.start_lat = lat || 0;
    defaultData.start_lon = lon || 0;
    defaultData.start_zoom = zoom || config.map.startZoom || 12;
    defaultData.min_zoom = config.map.minZoom || 10;
    defaultData.max_zoom = config.map.maxZoom || 18;
    return defaultData;
};

module.exports = router;