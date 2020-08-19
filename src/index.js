'use strict';

const path = require('path');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const express = require('express');
const cookieSession = require('cookie-session')
const app = express();
const mustacheExpress = require('mustache-express');
const i18n = require('i18n');
const helmet = require('helmet');

const config = require('./config.json');
const defaultData = require('./data/default.js');
const apiRoutes = require('./routes/api.js');
const discordRoutes = require('./routes/discord.js');
const uiRoutes = require('./routes/ui.js');

// TODO: Separate cluster layers by type
// TODO: Use api endpoint for each model type instead of one for all. Update and clear based on layers of types
// TODO: Notification sounds, bouncing icons
// TODO: Possibly change filter selection from a list to a grid
// TODO: Finish custom user settings modal
// TODO: Force logout of other devices if logged into multiple
// TODO: Glow for top pvp ranks
// TODO: Only clear layers if filter changed
// TODO: Reset all settings (clear cache/session)
// TODO: Filter candy/stardust quest by amount
// TODO: Icon spacing

// Basic security protection middleware
app.use(helmet());

// View engine
app.set('view engine', 'mustache');
app.set('views', path.resolve(__dirname, 'views'));
app.engine('mustache', mustacheExpress());

// Static paths
app.use(express.static(path.resolve(__dirname, '../static')));

// Body parser middlewares
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: false, limit: '500mb' }));

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
app.use(cookieSession({
    name: 'session',
    keys: [config.sessionSecret],
    maxAge: 518400000
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
app.use(async (req, res, next) => {
    if (config.discord.enabled && (req.path === '/api/discord/login' || req.path === '/login')) {
        return next();
    }
    if (!config.discord.enabled || req.session.logged_in) {
        defaultData.logged_in = true;
        defaultData.username = req.session.username;
        if (!config.discord.enabled) {
            return next();
        }
        if (!req.session.valid) {
            console.error('Invalid user authenticated', req.session.user_id);
            res.redirect('/login');
            return;
        }
        const perms = req.session.perms;
        defaultData.hide_map = !perms.map;
        if (defaultData.hide_map) {
            // No view map permissions, go to login screen
            console.error('Invalid view map permissions for user', req.session.user_id);
            res.redirect('/login');
            return;
        }
        defaultData.hide_pokemon = !perms.pokemon;
        defaultData.hide_raids = !perms.raids;
        defaultData.hide_gyms = !perms.gyms;
        defaultData.hide_pokestops = !perms.pokestops;
        defaultData.hide_quests = !perms.quests;
        defaultData.hide_lures = !perms.lures;
        defaultData.hide_invasions = !perms.invasions;
        defaultData.hide_spawnpoints = !perms.spawnpoints;
        defaultData.hide_iv = !perms.iv;
        defaultData.hide_cells = !perms.s2cells;
        defaultData.hide_submission_cells = !perms.submissionCells;
        defaultData.hide_nests = !perms.nests;
        defaultData.hide_weather = !perms.weather;
        defaultData.hide_devices = !perms.devices;
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