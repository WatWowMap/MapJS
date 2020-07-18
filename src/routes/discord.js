'use strict';

const express = require('express');
const axios = require('axios');
const router = express.Router();

const DiscordClient = require('../services/discord.js');
const utils = require('../services/utils.js');

const config = require('../config.json');
const redirect = encodeURIComponent(config.discord.redirectUri);

const catchAsyncErrors = fn => ((req, res, next) => {
    const routePromise = fn(req, res, next);
    if (routePromise.catch) {
        routePromise.catch(err => next(err));
    }
});

router.get('/login', (req, res) => {
    const scope = 'guilds%20identify%20email';
    res.redirect(`https://discordapp.com/api/oauth2/authorize?client_id=${config.discord.clientId}&scope=${scope}&response_type=code&redirect_uri=${redirect}`);
});

router.get('/callback', catchAsyncErrors(async (req, res) => {
    if (!req.query.code) {
        throw new Error('NoCodeProvided');
    }
    
    let data = `client_id=${config.discord.clientId}&client_secret=${config.discord.clientSecret}&grant_type=authorization_code&code=${req.query.code}&redirect_uri=${redirect}&scope=guilds%20identify%20email`;
    let headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    
    axios.post("https://discord.com/api/oauth2/token", data, {
        headers: headers
    }).then(async (response) => {
        const client = new DiscordClient(response.data.access_token);
        const user = await client.getUser();
        const guilds = await client.getGuilds();
        const roles = await client.getUserRoles(user.id);

        req.session.logged_in = true;
        req.session.user_id = user.id;
        req.session.username = `${user.username}#${user.discriminator}`;
        req.session.roles = roles;
        req.session.guilds = guilds;
        if (utils.hasGuild(guilds)) {
            res.redirect(`/?token=${response.data.access_token}`);
        } else {
            // Not in Discord server(s)
            res.redirect('/login');
        }
    }).catch(error => {
        console.error(error);
        throw new Error('UnableToFetchToken');
    });
}));

module.exports = router;
