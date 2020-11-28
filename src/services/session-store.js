'use strict';

const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);

const config = require('../services/config.js');
const MySQLConnector = require('../services/mysql.js');
const db = new MySQLConnector(config.db.scanner);

// MySQL session store
const sessionStore = new MySQLStore({
    // Database server IP address/hostname
    host: config.db.scanner.host,
    // Database server listening port
    port: config.db.scanner.port,
    // Database username
    user: config.db.scanner.username,
    // Password for the above database user
    password: config.db.scanner.password,
    // Database name to save sessions table to
    database: config.db.scanner.database,
    // Whether or not to automatically check for and clear expired sessions:
    clearExpired: true,
    // How frequently expired sessions will be cleared; milliseconds:
    checkExpirationInterval: 900000,
    // Whether or not to create the sessions database table, if one does not already exist
    createDatabaseTable: true,
    // Set Sessions table name
    schema: {
        tableName: config.db.scanner.sessionTable
    }
});

const isValidSession = async (userId) => {
    let sql = `
    SELECT session_id
    FROM ${config.db.scanner.sessionTable}
    WHERE
        json_extract(data, '$.user_id') = ?
        AND expires >= UNIX_TIMESTAMP()
    `;
    let args = [userId];
    let results = await db.query(sql, args);
    return results.length <= config.maxSessions;
};

const clearOtherSessions = async (userId, currentSessionId) => {
    let sql = `
    DELETE FROM ${config.db.scanner.sessionTable}
    WHERE
        json_extract(data, '$.user_id') = ?
        AND session_id != ?
    `;
    let args = [userId, currentSessionId];
    let results = await db.query(sql, args);
    console.log('[Session] Clear Result:', results);
};

module.exports = {
    sessionStore,
    isValidSession,
    clearOtherSessions
};
