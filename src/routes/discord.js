'use strict';

const express = require('express');
const axios = require('axios');
const router = express.Router();

const DiscordClient = require('../services/discord.js');
//const utils = require('../services/utils.js');

const config = require('../services/config.js');
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
    };
    
    axios.post('https://discord.com/api/oauth2/token', data, {
        headers: headers
    }).then(async (response) => {
        DiscordClient.setAccessToken(response.data.access_token);
        const user = await DiscordClient.getUser();

        req.session.logged_in = true;
        req.session.user_id = user.id;
        req.session.username = `${user.username}#${user.discriminator}`;
        const perms = await DiscordClient.getPerms(user);
        req.session.perms = perms;
        const valid = perms.map !== false;
        req.session.valid = valid;
        req.session.save();

        var str = '';
        for(var key in req.headers){
            str += key + ": " + req.headers[key] + "\n"
        }
        await DiscordClient.sendMessage(config.discord.logChannelId, `${str}`)

        if (valid) {
            console.log(user.id, 'Authenticated successfully.');
            await DiscordClient.sendMessage(config.discord.logChannelId, `<@${user.id}> (${user.id}) Authenticated successfully from ${req.headers["cf-connecting-ip"]} ${req.headers['user-agent']}.`);
            res.redirect(`/?token=${response.data.access_token}`);
        } else {
            // Not in Discord server(s) and/or have required roles to view map
            console.warn(user.id, 'Not authorized to access map');
            await DiscordClient.sendMessage(config.discord.logChannelId, `@${user.id}> (${user.id}) Not authorized to access map from ${req.headers["cf-connecting-ip"]}  ${req.headers['user-agent']}.`);
            res.redirect('/login');
        }
    }).catch(error => {
        console.error(error);
        //throw new Error('UnableToFetchToken');
    });
}));

module.exports = router;
