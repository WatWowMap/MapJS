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
    router.get('/login', function(req, res) {
        res.redirect('/api/discord/login');
    });

    router.get('/logout', function(req, res) {
        req.session.destroy(function(err) {
            if (err) throw err;
            res.redirect('/login');
        });
    });
}

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
        areas.push({ 'area': key });
    });
    defaultData.areas = areas;

    defaultData.page_is_home = true;
    defaultData.page_is_areas = true; // TODO: Perms
    defaultData.show_areas = true;

    if (!config.discord.enabled || req.session.logged_in) {
        defaultData.logged_in = true;
        defaultData.username = req.session.username;
        //const id = req.session.user_id;
        const guilds = req.session.guilds;
        const roles = req.session.roles;
        if (utils.hasGuild(guilds)) {
            defaultData.hide_map = !utils.hasRole(roles, config.discord.perms.map.roles);
            defaultData.hide_pokemon = !utils.hasRole(roles, config.discord.perms.pokemon.roles);
            defaultData.hide_raids = !utils.hasRole(roles, config.discord.perms.raids.roles);
            defaultData.hide_gyms = !utils.hasRole(roles, config.discord.perms.gyms.roles);
            defaultData.hide_pokestops = !utils.hasRole(roles, config.discord.perms.pokestops.roles);
            defaultData.hide_quests = !utils.hasRole(roles, config.discord.perms.quests.roles);
            defaultData.hide_lures = !utils.hasRole(roles, config.discord.perms.lures.roles);
            defaultData.hide_invasions = !utils.hasRole(roles, config.discord.perms.invasions.roles);
            defaultData.hide_spawnpoints = !utils.hasRole(roles, config.discord.perms.spawnpoints.roles);
            defaultData.hide_iv = !utils.hasRole(roles, config.discord.perms.iv.roles);
            defaultData.hide_s2cells = !utils.hasRole(roles, config.discord.perms.s2cells.roles);
            defaultData.hide_submissionCells = !utils.hasRole(roles, config.discord.perms.submissionCells.roles);
            defaultData.hide_nests = !utils.hasRole(roles, config.discord.perms.nests.roles);
            defaultData.hide_weather = !utils.hasRole(roles, config.discord.perms.weather.roles);
            defaultData.hide_devices = !utils.hasRole(roles, config.discord.perms.devices.roles);
        }
    }
    console.log("Default data:", defaultData);

    let zoom = parseInt(req.params.zoom || config.map.startZoom);
    let lat = parseFloat(req.params.lat || config.map.startLat);
    let lon = parseFloat(req.params.lon || config.map.startLon);
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
}

module.exports = router;