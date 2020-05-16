'use strict';

const express = require('express');
const router = express.Router();

const config = require('../config.json');
const defaultData = require('../data/default.js');

//response.setHeader(.accessControlAllowHeaders, value: "*")
//response.setHeader(.accessControlAllowMethods, value: "GET")

defaultData.avilable_forms_json = '{}',
defaultData.avilable_items_json = '{}',
//avilable_tileservers_json: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png;Map data Â© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors']


router.get(['/', '/index'], function(req, res) {
    const tileserverString = `
    Default;https://tile.openstreetmap.org/{z}/{x}/{y}.png;Map data Â© <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors
    DarkMatter;https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png;Â© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors Â© <a href="https://carto.com/attributions">CARTO</a>
    `;
    let tileservers = {};
    const tiles = tileserverString.split('\n');
    for (let i = 0; i < tiles.length; i++) {
        const split = tiles[i].split(';');
        if (split.length === 3) {
            const name = split[0].trim();
            tileservers[name] = {
                url: split[1].trim(),
                attribution: split[2].trim()
            };
        }
    }
    defaultData.avilable_tileservers_json = JSON.stringify(tileservers);
    defaultData.page_is_home = true
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
    if (city === null) {
        let tmpCity = req.params.lat;
        city = tmpCity;
        const tmpZoom = parseInt(req.params.lon);
        if (tmpZoom > 0) {
            zoom = tmpZoom;
        }
    }

    if (city) {
        lat = parseFloat(citySetting['lat']);
        lon = parseFloat(citySetting['lon']);
        if (zoom === null) {
            zoom = parseInt(citySetting['zoom']);
        }
    }

    if ((zoom || config.startZoom) > config.maxZoom) {
        zoom = config.maxZoom;
    } else if ((zoom || config.startZoom) < config.minZoom) {
        zoom = config.minZoom;
    }

    defaultData.start_lat = lat || 0;
    defaultData.start_lon = lon || 0;
    defaultData.zoom = zoom || config.startZoom || 12;
    defaultData.min_zoom = config.minZoom || 10;
    defaultData.max_zoom = config.maxZoom || 18;

    res.render('index', defaultData);
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
    //WebReqeustHandler.handle(request, response, .home, [.viewMap])
});

router.get('/@/:lat/:lon/:zoom', function(req, res) {
    //WebReqeustHandler.handle(request, response, .home, [.viewMap])
});

router.get('/@/:city', function(req, res) {
    //WebReqeustHandler.handle(request, response, .home, [.viewMap])
});

router.get('/@/:city/:zoom', function(req, res) {
    //WebReqeustHandler.handle(request, response, .home, [.viewMap])
});

module.exports = router;