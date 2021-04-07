/* global BigInt */
'use strict';

const config = require('../services/config.js');
const areas = require('../services/areas.js');
const DiscordOauth2 = require('discord-oauth2');
const Discord = require('discord.js');
const fs = require('fs');
const oauth = new DiscordOauth2();
const client = new Discord.Client();

if (config.discord.enabled) {
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
        client.user.setPresence({ activity: { name: config.discord.status, type: 3 } });
    });
  
    client.login(config.discord.botToken);
}

class DiscordClient {
    //static instance = new DiscordClient();

    constructor(accessToken) {
        this.accessToken = accessToken;
        this.config = config;
        this.discordEvents();
    }

    setAccessToken(token) {
        this.accessToken = token;
    }

    async getUser() {
        return await oauth.getUser(this.accessToken);
    }

    async getGuilds() {
        const guilds = await oauth.getUserGuilds(this.accessToken);
        const guildIds = Array.from(guilds, x => BigInt(x.id).toString());
        return [guildIds, guilds];
    }

    async getUserRoles(guildId, userId) {
        try {
            const members = await client.guilds.cache
                .get(guildId)
                .members
                .fetch();
            const member = members.get(userId);
            const roles = member.roles.cache
                .filter(x => BigInt(x.id).toString())
                .keyArray();
            return roles;
        } catch (e) {
            console.error('Failed to get roles in guild', guildId, 'for user', userId);
        }
        return [];
    }

    async discordEvents() {
        client.config = this.config;
        try {
            fs.readdir(`${__dirname}/events/`, (err, files) => {
                if (err) return this.log.error(err);
                files.forEach((file) => {
                    const event = require(`${__dirname}/events/${file}`); // eslint-disable-line global-require
                    const eventName = file.split('.')[0];
                    client.on(eventName, event.bind(null, client));
                });
            });
        } catch (err) {
            console.error('Failed to activate an event');
        }
    }

    async getPerms(user) {
        var perms = {
            map: false,
            pokemon: false,
            raids: false,
            gyms: false,
            pokestops: false,
            quests: false,
            lures: false,
            invasions: false,
            spawnpoints: false,
            iv: false,
            pvp: false,
            s2cells: false,
            submissionCells: false,
            nests: false,
            portals: false,
            scanAreas: false,
            weather: false,
            devices: false,
            areaRestrictions: []
        };
        const [guilds, guildsFull] = await this.getGuilds();
        if (config.discord.allowedUsers.includes(user.id)) {
            Object.keys(perms).forEach((key) => perms[key] = true);
            console.log(`User ${user.username}#${user.discriminator} (${user.id}) in allowed users list, skipping guild and role check.`);
            return perms;
        }

        let blocked = false;
        let overwriteAreaRestrictions = false;

        for (let i = 0; i < config.discord.blockedGuilds.length; i++) {
            const guildId = config.discord.blockedGuilds[i];
            // Check if user's guilds contains blocked guild
            if (guilds.includes(guildId)) {
                // If so, user is not granted access
                blocked = true;
                perms['blocked'] = guildsFull.find(x => x.id === guildId).name;
                break;
            }
        }
        if (blocked) {
            // User is in blocked guild
            return perms;
        }
        for (let i = 0; i < config.discord.allowedGuilds.length; i++) {
            // Check if user is in config guilds
            const guildId = config.discord.allowedGuilds[i];
            if (!guilds.includes(guildId)) {
                continue;
            }
            const keys = Object.keys(config.discord.perms);
            // Check if assigned role to user is in config roles
            const userRoles = await this.getUserRoles(guildId, user.id);
            // Loop through each permission section
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                let configItem = config.discord.perms[key];
                if (configItem.enabled && configItem.roles.length === 0) {
                    // If type enabled and no roles specified, set as valid
                    perms[key] = true;
                    continue;
                }
                if (!configItem.enabled) {
                    continue;
                }
                // Check if user has config role assigned
                for (let k = 0; k < userRoles.length; k++) {
                    // Check if assigned role to user is in config roles
                    if (configItem.roles.includes(userRoles[k])) {
                        perms[key] = true;
                    }
                }
            }

            // Continue if areas file is not loaded
            if (Object.keys(areas.names).length === 0) continue;

            // Check once if user role is defined inside areaRestrictions
            for (let k = 0; k < userRoles.length; k++) {
                for (const role of Object.values(config.discord.areaRestrictions)) {
                    if (role['roles'].includes(userRoles[k])) {
                        // Check if there's empty list for any of user roles, if so we disable restrictions
                        if (role['areas'].length === 0) {
                            overwriteAreaRestrictions = true;
                        } else if (!overwriteAreaRestrictions) {
                            for (const areaName of role['areas']) {
                                if (areas.names.includes(areaName)) {
                                    perms.areaRestrictions.push(areaName);
                                }
                            }
                        }
                    }
                }
            }
        }
        // If any of user roles have no restrictions we are allowing all
        if (overwriteAreaRestrictions && perms.areaRestrictions) perms.areaRestrictions = [];
        // Remove duplicates from perms.areaRestrictions
        if (perms.areaRestrictions.length !== 0) perms.areaRestrictions = [...new Set(perms.areaRestrictions)];

        return perms;
    }

    async sendMessage(channelId, message) {
        if (!channelId) {
            return;
        }
        const channel = await client.channels.cache
            .get(channelId)
            .fetch();
        if (channel && message) {
            channel.send(message);
        }
    }
}

module.exports = new DiscordClient();
