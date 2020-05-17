'use strict';

const express = require('express');
const router = express.Router();

const map = require('../data/map.js');

router.get('/get_data', async function(req, res) {
    const data = await map.getData(req, res, req.query);
    res.json({ data: data });
});

router.post('/get_data', async function(req, res) {
    const data = await map.getData(req, res, req.body);
    res.json({ data: data });
});

module.exports = router;