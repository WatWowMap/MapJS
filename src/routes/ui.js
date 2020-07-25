'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const config = require('../config.json');
const defaultData = require('../data/default.js');
const InventoryItemId = require('../data/item.js');

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

// Map endpoints
router.get(['/', '/index'], (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    const data = handlePage(req, res);
    res.render('index', data);
});

router.get('/index.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    const data = handleHomeJs(req, res);
    res.render('index-js', data);
});

router.get('/index.css', (req, res) => {
    res.setHeader('Content-Type', 'text/css');
    res.render('index-css', defaultData);
});

// Location endpoints
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
    const data = defaultData;
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
    data.available_tileservers_json = JSON.stringify(tileservers);

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
    data.available_forms_json = JSON.stringify(availableForms);

    // Build available items list
    const availableItems = [-3, -2, -1];
    const keys = Object.keys(InventoryItemId);
    keys.forEach(key => {
        const itemId = InventoryItemId[key];
        availableItems.push(itemId);
    });
    data.available_items_json = JSON.stringify(availableItems);    

    // Build available areas list
    const areas = [];
    const areaKeys = Object.keys(config.areas).sort();
    areaKeys.forEach(key => {
        areas.push({ 'area': key });
    });
    data.areas = areas;

    // Custom navigation bar headers
    data.buttons_left = config.header.left;
    data.buttons_right = config.header.right;

    if (!config.discord.enabled || req.session.logged_in) {
        data.logged_in = true;
        data.username = req.session.username;
        if (config.discord.enabled) {
            if (req.session.valid) {
                const perms = req.session.perms;
                data.hide_map = !perms.map;
                data.hide_pokemon = !perms.pokemon;
                data.hide_raids = !perms.raids;
                data.hide_gyms = !perms.gyms;
                data.hide_pokestops = !perms.pokestops;
                data.hide_quests = !perms.quests;
                data.hide_lures = !perms.lures;
                data.hide_invasions = !perms.invasions;
                data.hide_spawnpoints = !perms.spawnpoints;
                data.hide_iv = !perms.iv;
                data.hide_cells = !perms.s2cells;
                data.hide_submission_cells = !perms.submissionCells;
                data.hide_nests = !perms.nests;
                data.hide_weather = !perms.weather;
                data.hide_devices = !perms.devices;
            } else {
                console.log(req.session.username, 'Not authorized to access map');
                res.redirect('/login');
            }
        }
    }

    data.page_is_home = true;
    data.page_is_areas = true;
    data.show_areas = true;
    let lat = parseFloat(req.params.lat || config.map.startLat);
    let lon = parseFloat(req.params.lon || config.map.startLon);
    let city = req.params.city || null;
    let zoom = parseInt(req.params.zoom || config.map.startZoom);

    // City specified but in wrong route
    /*
    if (city === null) {
        const tmpCity = req.params.lat;
        city = tmpCity;
        const tmpZoom = parseInt(req.params.lon);
        if (tmpZoom > 0) {
            zoom = tmpZoom;
        }
    }
    */

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
                break;
            }
        }
    }

    if ((zoom || config.map.startZoom) > config.map.maxZoom) {
        zoom = config.map.maxZoom;
    } else if ((zoom || config.map.startZoom) < config.map.minZoom) {
        zoom = config.map.minZoom;
    }

    data.start_lat = lat || 0;
    data.start_lon = lon || 0;
    data.start_zoom = zoom || config.map.startZoom || 12;
    data.lat = lat || 0;
    data.lon = lon || 0;
    data.zoom = zoom || config.map.startZoom || 12;
    data.min_zoom = config.map.minZoom || 10;
    data.max_zoom = config.map.maxZoom || 18;
    return data;
};

const handleHomeJs = (req, res) => {
    const data = defaultData;
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
    data.available_tileservers_json = JSON.stringify(tileservers);

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
    data.available_forms_json = JSON.stringify(availableForms);

    // Build available items list
    const availableItems = [-3, -2, -1];
    const keys = Object.keys(InventoryItemId);
    keys.forEach(key => {
        const itemId = InventoryItemId[key];
        availableItems.push(itemId);
    });
    data.available_items_json = JSON.stringify(availableItems);

    // Map settings
    data.start_lat = req.query.lat || config.map.startLat;
    data.start_lon = req.query.lon || config.map.startLon;
    data.start_zoom = req.query.zoom || config.map.startZoom;
    data.lat = req.query.lat || config.map.startLat;
    data.lon = req.query.lon || config.map.startLon;
    data.zoom = req.query.zoom || config.map.startZoom;
    data.min_zoom = req.query.min_zoom || config.map.minZoom;
    data.max_zoom = req.query.max_zoom || config.map.maxZoom;
    data.max_pokemon_id = config.maxPokemonId;
    //data["start_pokemon"] = request.param(name: "start_pokemon")
    //data["start_pokestop"] = request.param(name: "start_pokestop")
    //data["start_gym"] = request.param(name: "start_gym")
    return data;
};

module.exports = router;