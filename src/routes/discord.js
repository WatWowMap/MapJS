'use strict';

const express = require('express');
const fetch = require('node-fetch');
const btoa = require('btoa');
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

router.get('/callback', catchAsyncErrors(async function(req, res) {
    if (!req.query.code) {
        throw new Error('NoCodeProvided');
    }
    const code = req.query.code;
    const creds = btoa(`${config.discord.clientId}:${config.discord.clientSecret}`);
    const response = await fetch(`https://discordapp.com/api/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${redirect}`,
        {
            method: 'POST',
            headers: {
                Authorization: `Basic ${creds}`,
            }
        });
    const json = await response.json();
    const client = new DiscordClient(json.access_token);
    const user = await client.getUser();
    const guilds = await client.getGuilds();
    const roles = await client.getUserRoles(user.id);

    req.session.logged_in = true;
    req.session.username = `${user.username}#${user.discriminator}`;
    req.session.roles = roles;
    if (utils.hasGuild(guilds)) {
        res.redirect(`/?token=${json.access_token}`);
    } else {
        // Not in Discord server(s)
        res.redirect('/login');
    }
}));

module.exports = router;