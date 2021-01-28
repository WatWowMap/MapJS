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
        const blocked = perms.blocked;
        const valid = perms.map !== false;
        req.session.valid = valid;
        req.session.save();

        const ip = req.headers['cf-connecting-ip'] || ((req.headers['x-forwarded-for'] || '').split(', ')[0]) || (req.connection.remoteAddress || req.connection.localAddress).match('[0-9]+.[0-9].+[0-9]+.[0-9]+$')[0];
        const url = `http://ip-api.com/json/${ip}?fields=66846719&lang=${config.locale || 'en'}`;
        const geoResponse = await axios.get(url);
        const geo = geoResponse.data;
        const embed = {
            color: 0xFF0000,
            title: 'Failure',
            author: {
                name: `${user.username}#${user.discriminator}`,
                icon_url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
            },
            description: 'User Failed Authentication',
            thumbnail: {
                url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png`,
            },
            fields: [
                {
                    name: 'Discord Id',
                    value: `<@${user.id}>`,
                },
                { 
                    name: 'Client Info',  
                    value: req.headers['user-agent'] 
                },
                { 
                    name: 'Ip Address',
                    value: `||${ip}||` 
                },
                {
                    name: 'Geo Lookup',
                    value: `${geo['city']}, ${geo['regionName']}, ${geo['zip']}` 
                },
                {
                    name: 'Google Map',
                    value: `https://www.google.com/maps?q=${geo['lat']},${geo['lon']}` 
                },
                {
                    name: 'Network Provider',
                    value: `${geo['isp']}, ${geo['as']}`
                },
                {
                    name: 'Mobile',
                    value: `${geo['mobile']}`,
                    inline: true
                },
                {
                    name: 'Proxy',
                    value: `${geo['proxy']}`,
                    inline: true
                },
                {
                    name: 'Hosting',
                    value: `${geo['hosting']}`,
                    inline: true
                },
            ],
            timestamp: new Date(),
        };
        let redirect;
        if (valid) {
            console.log(user.id, 'Authenticated successfully.');
            embed.title = 'Success';
            embed.description = 'User Successfully Authenticated';
            embed.color = 0x00FF00;
            redirect = `/?token=${response.data.access_token}`;
        } else if (blocked) {
            // User is in blocked Discord server(s)
            console.warn(user.id, 'Blocked due to', blocked);
            embed.title = 'Blocked';
            embed.description = 'User Blocked Due to ' + blocked;
            embed.color = 0xFF0000;
            redirect = '/blocked';
        } else {
            // Not in Discord server(s) and/or have required roles to view map
            console.warn(user.id, 'Not authorized to access map');
            redirect = config.homepage.enabled ? '/home' : '/login';
        }
        await DiscordClient.sendMessage(config.discord.logChannelId, {embed: embed});
        res.redirect(redirect);
    }).catch(error => {
        console.error(error);
        //throw new Error('UnableToFetchToken');
    });
}));

module.exports = router;
