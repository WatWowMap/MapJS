'use strict';

const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const TemplatesDir = path.resolve(__dirname, '../../templates');
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

const fileExists = async (path) => {
    return new Promise((resolve, reject) => {
        try {
            fs.exists(path, (exists) => {
                resolve(exists);
            });
        } catch (e) {
            return reject(e);
        }
    });
};

const render = async (name, data) => {
    const filePath = path.resolve(TemplatesDir, name + '.ejs');
    if (!await fileExists(filePath)) {
        throw `Template ${filePath} does not exist!`;
    }
    return new Promise((resolve, reject) => {
        try {
            ejs.renderFile(filePath, data, (err, str) => {
                if (err) {
                    console.error('Template render error:', err);
                    //return reject(err);
                }
                resolve(str);
            });
        } catch (e) {
            console.error('Template error:', e);
            return reject(e);
        }
    });
};

module.exports = {
    generateString,
    hasGuild,
    hasRole,
    zeroPad,
    fileExists,
    render
};
