'use strict';

const path = require('path');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const express = require('express');
const session = require('express-session');
const app = express();
const mustacheExpress = require('mustache-express');
const i18n = require('i18n');
const helmet = require('helmet');

const config = require('./config.json');
const defaultData = require('./data/default.js');
const apiRoutes = require('./routes/api.js');
const discordRoutes = require('./routes/discord.js');
const uiRoutes = require('./routes/ui.js');
const utils = require('./services/utils.js');

// TODO: submission_placement_cells, submission_placement_rings, and submission_type_cells
// TODO: PvP filter

// Basic security protection middleware
app.use(helmet());

// View engine
app.set('view engine', 'mustache');
app.set('views', path.resolve(__dirname, 'views'));
app.engine('mustache', mustacheExpress());

// Static paths
app.use(express.static(path.resolve(__dirname, '../static')));

// Body parser middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false, limit: '50mb' })); // for parsing application/x-www-form-urlencoded

// Initialize localzation handler
i18n.configure({
    locales:['en', 'es', 'de'],
    directory: path.resolve(__dirname, '../static/locales')
});
app.use(i18n.init);

// Register helper as a locals function wrroutered as mustache expects
app.use((req, res, next) => {
    // Mustache helper
    res.locals.__ = () => {
        /* eslint-disable no-unused-vars */
        return (text, render) => {
        /* eslint-enable no-unused-vars */
            return i18n.__.routerly(req, arguments);
        };
    };
    next();
});

// Set locale
i18n.setLocale(config.locale);

// Sessions middleware
app.use(session({
    secret: utils.generateString(),
    resave: true,
    saveUninitialized: true
}));

// CSRF token middleware
app.use(cookieParser());
app.use(csrf({ cookie: true }));
app.use((req, res, next) => {
    var csrf = req.csrfToken();
    defaultData.csrf = csrf;
    //console.log("CSRF Token:", csrf);
    res.cookie('x-csrf-token', csrf);
    res.cookie('TOKEN', csrf);
    res.locals.csrftoken = csrf;
    next();
});

if (config.discord.enabled) {
    app.use('/api/discord', discordRoutes);

    // Discord error middleware
    /* eslint-disable no-unused-vars */
    app.use((err, req, res, next) => {
        switch (err.message) {
        case 'NoCodeProvided':
            return res.status(400).send({
                status: 'ERROR',
                error: err.message,
            });
        default:
            return res.status(500).send({
                status: 'ERROR',
                error: err.message,
            });
        }
    });
    /* eslint-enable no-unused-vars */
}

// Login middleware
app.use((req, res, next) => {
    if (config.discord.enabled && (req.path === '/api/discord/login' || req.path === '/login')) {
        return next();
    }
    if (req.session.user_id && req.session.username && req.session.guilds && req.session.roles) {
        //console.log("Previous discord auth still active for user id:", req.session.user_id);
        return next();
    }
    if (!config.discord.enabled || req.session.logged_in) {
        defaultData.logged_in = true;
        defaultData.username = req.session.username;
        //const id = req.session.user_id;
        const guilds = req.session.guilds;
        const roles = req.session.roles;
        if (utils.hasGuild(guilds)) {
            defaultData.hide_map = !utils.hasRole(roles, config.discord.perms.map.roles);
            defaultData.hide_pokemon = !utils.hasRole(roles, config.discord.perms.pokemon.roles);
            defaultData.hide_raids = !utils.hasRole(roles, config.discord.perms.raids.roles);
            defaultData.hide_gyms = !utils.hasRole(roles, config.discord.perms.gyms.roles);
            defaultData.hide_pokestops = !utils.hasRole(roles, config.discord.perms.pokestops.roles);
            defaultData.hide_quests = !utils.hasRole(roles, config.discord.perms.quests.roles);
            defaultData.hide_lures = !utils.hasRole(roles, config.discord.perms.lures.roles);
            defaultData.hide_invasions = !utils.hasRole(roles, config.discord.perms.invasions.roles);
            defaultData.hide_spawnpoints = !utils.hasRole(roles, config.discord.perms.spawnpoints.roles);
            defaultData.hide_iv = !utils.hasRole(roles, config.discord.perms.iv.roles);
            defaultData.hide_s2cells = !utils.hasRole(roles, config.discord.perms.s2cells.roles);
            defaultData.hide_submissionCells = !utils.hasRole(roles, config.discord.perms.submissionCells.roles);
            defaultData.hide_nests = !utils.hasRole(roles, config.discord.perms.nests.roles);
            defaultData.hide_weather = !utils.hasRole(roles, config.discord.perms.weather.roles);
            defaultData.hide_devices = !utils.hasRole(roles, config.discord.perms.devices.roles);
        }
        return next();
    }
    res.redirect('/login');
});

// API routes
app.use('/api', apiRoutes);

// UI routes
app.use('/', uiRoutes);

// Start listener
app.listen(config.port, config.interface, () => console.log(`Listening on port ${config.port}...`));