'use strict';

const utils = require('../services/utils.js');
const config = require('../config.json');

class Perms {
    username;
    roles;

    map;
    pokemon;
    raids;
    gyms;
    pokestops;
    quests;
    lures;
    invasions;
    spawnpoints;
    iv;
    s2cells;
    submissionCells;
    nests;
    weather;
    devices;

    constructor(username, roles) {
        this.username = username,
        this.roles = roles;
        this.map = utils.hasRole(roles, config.discord.perms.map.roles);
        this.pokemon = utils.hasRole(roles, config.discord.perms.pokemon.roles);
        this.raids = utils.hasRole(roles, config.discord.perms.raids.roles);
        this.gyms = utils.hasRole(roles, config.discord.perms.gyms.roles);
        this.pokestops = utils.hasRole(roles, config.discord.perms.pokestops.roles);
        this.quests = utils.hasRole(roles, config.discord.perms.quests.roles);
        this.lures = utils.hasRole(roles, config.discord.perms.lures.roles);
        this.invasions = utils.hasRole(roles, config.discord.perms.invasions.roles);
        this.spawnpoints = utils.hasRole(roles, config.discord.perms.spawnpoints.roles);
        this.iv = utils.hasRole(roles, config.discord.perms.iv.roles);
        this.s2cells = utils.hasRole(roles, config.discord.perms.s2cells.roles);
        this.submissionCells = utils.hasRole(roles, config.discord.perms.submissionCells.roles);
        this.nests = utils.hasRole(roles, config.discord.perms.nests.roles);
        this.weather = utils.hasRole(roles, config.discord.perms.weather.roles);
        this.devices = utils.hasRole(roles, config.discord.perms.devices.roles);
    }
}

module.exports = Perms;