'use strict';

const config = require('../services/config.js');

const generateString = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const hasGuild = (guilds) => {
    if (!config.discord.enabled) {
        return true;
    }
    if (config.discord.allowedGuilds.length === 0) {
        return true;
    }
    if (guilds.length === 0) {
        return false;
    }
    for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i];
        if (config.discord.allowedGuilds.includes(guild)) {
            return true;
        }
    }
    return false;
};

const hasRole = (userRoles, requiredRoles) => {
    if (!config.discord.enabled) {
        return true;
    }
    if (requiredRoles.length === 0) {
        return true;
    }
    if (userRoles.length === 0) {
        return false;
    }
    for (let i = 0; i < userRoles.length; i++) {
        const role = userRoles[i];
        if (requiredRoles.includes(role)) {
            return true;
        }
    }
    return false;
};

const zeroPad = (num, places) => String(num).padStart(places, '0');

module.exports = {
    generateString,
    hasGuild,
    hasRole,
    zeroPad
};
