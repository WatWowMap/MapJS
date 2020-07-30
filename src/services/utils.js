'use strict';

const fs = require('fs');
const config = require('../config.json');

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

const getFiles = async (directory) => {
    return new Promise((resolve, reject) => {
        try {
            fs.readdir(directory, (err, files) => {
                if (err) {
                    return reject(err);
                }
                resolve(files);
            });
        } catch (e) {
            return reject(e);
        }
    });
};

const createDirectory = async (directory) => {
    return new Promise((resolve, reject) => {
        try {
            fs.mkdir(directory, () => resolve());
        } catch (e) {
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
    getFiles,
    createDirectory
};