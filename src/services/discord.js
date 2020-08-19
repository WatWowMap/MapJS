/* global BigInt */
'use strict';

const config = require('../config.json');

const DiscordOauth2 = require('discord-oauth2');
const oauth = new DiscordOauth2();

const Discord = require('discord.js');
const client = new Discord.Client();

if (config.discord.enabled) {
    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
            client.user.setPresence({ activity: { name: config.discord.status, type: 3 }
        });
    });
  
    client.login(config.discord.botToken);
}

class DiscordClient {
    //static instance = new DiscordClient();

    constructor(accessToken) {
        this.accessToken = accessToken;
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
        return guildIds;
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

    async getPerms() {
        const perms = {
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
            weather: false,
            devices: false
        };
        const user = await this.getUser();
        const guilds = await this.getGuilds();
        for (let i = 0; i < config.discord.guilds.length; i++) {
            // Check if user is in config guilds
            const guildId = config.discord.guilds[i];
            if (!guilds.includes(guildId)) {
                continue;
            }
            const keys = Object.keys(config.discord.perms);
            // Loop through each permission section
            for (let j = 0; j < keys.length; j++) {
                const key = keys[j];
                let configItem = config.discord.perms[key];
                if (configItem.enabled && configItem.roles.length === 0) {
                    // If type enabled and no roles specified, set as valid
                    perms[key] = true;
                    continue;
                }
                
                // If set, grab user roles for guild
                const userRoles = await this.getUserRoles(guildId, user.id);
                // Check if user has config role assigned
                for (let k = 0; k < userRoles.length; k++) {
                    // Check if assigned role to user is in config roles
                    if (configItem.roles.includes(userRoles[k])) {
                        perms[key] = true;
                    }
                }
            }
        }
        return perms;
    }
}

module.exports = new DiscordClient();
