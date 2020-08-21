'use strict';

const fs = require('fs');
const path = require('path');
const mustache = require('mustache');

const config = require('../config.json');
const TemplatesDir = path.resolve(__dirname, '../../templates');

const generateString = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

const hasGuild = (guilds) => {
    if (!config.discord.enabled) {
        return true;
    }
    if (config.discord.guilds.length === 0) {
        return true;
    }
    if (guilds.length === 0) {
        return false;
    }
    for (let i = 0; i < guilds.length; i++) {
        const guild = guilds[i];
        if (config.discord.guilds.includes(guild)) {
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

const fileRead = async (path) => {
    return new Promise((resolve, reject) => {
        try {
            fs.readFile(path, 'utf-8', (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        } catch (e) {
            return reject(e);
        }
    });
};

const render = async (name, data) => {
    try {
        const filePath = path.resolve(TemplatesDir, name);
        if (!await fileExists(filePath)) {
            console.error('Template', filePath, 'does not exist!');
            return;
        }
        const templateData = await fileRead(filePath);
        const result = mustache.render(templateData, data);
        return result;
    } catch (e) {
        return reject(e);
    }
};

module.exports = {
    generateString,
    hasGuild,
    hasRole,
    zeroPad,
    fileExists,
    fileRead,
    render
};