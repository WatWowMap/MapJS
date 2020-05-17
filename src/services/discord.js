'use strict';

const config = require('../config.json');
const utils = require('./utils.js');

const DiscordOauth2 = require('discord-oauth2');
const oauth = new DiscordOauth2();

const Discord = require('discord.js');
const client = new Discord.Client();

client.on('ready', function() {
    console.log(`Logged in as ${client.user.tag}!`);
});
  
client.on('message', function(msg) {
    if (msg.content === 'ping') {
        msg.reply('pong');
    }
});
  
client.login(config.discord.botToken);

class DiscordClient {
    constructor(accessToken) {
        this.accessToken = accessToken;
    }
    async getUser() {
        return await oauth.getUser(this.accessToken);
    }
    async getGuilds() {
        const guilds = await oauth.getUserGuilds(this.accessToken);
        const guildIds = Array.from(guilds, x => x.id);
        return guildIds;
    }
    async getUserRoles(id) {
        const user = await client.users.fetch(id);
        const rolemgr = user.presence.member.roles;
        const roles = rolemgr.member._roles;
        return roles;
    }
    async isValid(configItem) {
        if (configItem.enabled && configItem.roles.length === 0) {
            return true;
        }
        const user = await this.getUser();
        const roles = await this.getUserRoles(user.id);
        const guilds = await this.getGuilds();
        const guildResult = utils.hasGuild(guilds);
        const roleResult = utils.hasRole(roles, configItem.roles);
        return guildResult && roleResult;
    }
}

module.exports = DiscordClient;