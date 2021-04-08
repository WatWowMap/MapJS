'use strict';

const path = require('path');
const compression = require('compression');
const express = require('express');
const session = require('express-session');
const app = express();
const mustacheExpress = require('mustache-express');
const i18n = require('i18n');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./services/config.js');
const defaultData = require('./data/default.js');
const apiRoutes = require('./routes/api.js');
const discordRoutes = require('./routes/discord.js');
const uiRoutes = require('./routes/ui.js');
const { sessionStore, isValidSession, clearOtherSessions } = require('./services/session-store.js');

const RateLimitTime = config.ratelimit.time * 60 * 1000;
const MaxRequestsPerHour = config.ratelimit.requests * (RateLimitTime / 1000);

const rateLimitOptions = {
    windowMs: RateLimitTime, // Time window in milliseconds
    max: MaxRequestsPerHour, // Start blocking after x requests
    headers: true,
    message: {
        status: 429, // optional, of course
        limiter: true,
        type: 'error',
        message: `Too many requests from this IP, please try again in ${config.ratelimit.time} minutes.`
    },
    /* eslint-disable no-unused-vars */
    onLimitReached: (req, res, options) => {
    /* eslint-enable no-unused-vars */
        //console.error('Rate limit reached! Redirect to landing page.');
        //res.status(options.message.status).send(options.message.message);
        // TODO: Fix redirect
        res.redirect('/429');
    }
};
const requestRateLimiter = rateLimit(rateLimitOptions);

// Healthcheck secret to allow Docker container to bypass Discord redirect
const HealthcheckSecret = process.env['HEALTHCHECK_SECRET'];

// Basic security protection middleware
app.use(helmet());

// View engine
app.set('view engine', 'mustache');
app.set('views', path.resolve(__dirname, 'views'));
app.engine('mustache', mustacheExpress());

// Compression middleware
app.use(compression());

// Static paths
app.use(express.static(path.resolve(__dirname, '../static')));

// Body parser middlewares
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: false, limit: '500mb' }));

// Initialize localzation handler
i18n.configure({
    locales:['en', 'es', 'de', 'pl'],
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
/*
app.use(cookieSession({
    name: 'session',
    keys: [config.sessionSecret],
    maxAge: 518400000,
    store: sessionStore
}));
*/
app.use(session({
    key: 'session',
    secret: config.sessionSecret,
    store: sessionStore,
    resave: true,
    saveUninitialized: false,
    cookie: {maxAge: 604800000}
}));

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
    // If Discord auth enabled and visiting any of the following
    // endpoint paths, allow viewing the endpoint
    if (config.discord.enabled &&
        (
            req.path === '/api/discord/login' ||
            req.path === '/login' ||
            req.path === '/blocked' ||
            (config.homepage.enabled && req.path === '/home')
        )
    ) {
        return next();
    }
    const healthcheckHeader = req.get('Healthcheck-Secret');
    const healthcheckValid = healthcheckHeader && healthcheckHeader.length > 0 && healthcheckHeader === HealthcheckSecret;
    if (!config.discord.enabled || healthcheckValid || req.session.logged_in) {
        defaultData.logged_in = true;
        defaultData.username = req.session.username;
        if (!(await isValidSession(req.session.user_id))) {
            console.debug('[Session] Detected multiple sessions, clearing old ones...');
            await clearOtherSessions(req.session.user_id, req.sessionID);
        }
        if (config.discord.enabled && !req.session.valid) {
            console.error('Invalid user authenticated', req.session.user_id);
            if (config.homepage.enabled) {
                res.redirect('/home');
            } else {
                res.redirect('/login');
            }
            return;
        }
        const perms = req.session.perms;
        defaultData.hide_map = perms && !perms.map;
        if (defaultData.hide_map) {
            // No view map permissions, go to login screen
            console.error('Invalid view map permissions for user', req.session.user_id);
            if (config.homepage.enabled) {
                res.redirect('/home');
            } else {
                res.redirect('/login');
            }
            return;
        }
        defaultData.hide_pokemon = perms && !perms.pokemon;
        defaultData.hide_raids = perms && !perms.raids;
        defaultData.hide_gyms = perms && !perms.gyms;
        defaultData.hide_pokestops = perms && !perms.pokestops;
        defaultData.hide_quests = perms && !perms.quests;
        defaultData.hide_lures = perms && !perms.lures;
        defaultData.hide_invasions = perms && !perms.invasions;
        defaultData.hide_spawnpoints = perms && !perms.spawnpoints;
        defaultData.hide_iv = perms && !perms.iv;
        defaultData.hide_cells = perms && !perms.s2cells;
        defaultData.hide_submission_cells = perms && !perms.submissionCells;
        defaultData.hide_nests = perms && !perms.nests;
        defaultData.hide_portals = perms && !perms.portals;
        defaultData.hide_scan_areas = perms && !perms.scanAreas;
        defaultData.hide_weather = perms && !perms.weather;
        defaultData.hide_devices = perms && !perms.devices;
        return next();
    }
    if (config.homepage.enabled) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});

// UI routes
app.use('/', uiRoutes);

app.use('/api', requestRateLimiter);

// API routes
app.use('/api', apiRoutes);

// Start listener
app.listen(config.port, config.interface, () => console.log(`Listening on port ${config.port}...`));
