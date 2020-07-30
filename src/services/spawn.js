'use strict';

const child = require('child_process');

const exec = (path, args) => {
    return new Promise((resolve, reject) => {
        try {
            const shell = child.spawn(path, args);
            shell.stdout.on('data', (data) => {
                console.log('Stdout:' + data.toString());
            });
            shell.stderr.on('data', (data) => {
                console.log('[ERROR] Stderr:', data.toString());
                resolve(data.toString());
            });
            shell.on('close', (code) => {
                //console.log('Child process exited with code:', code);
                if (code > 0) {
                    console.error('[ERROR] Child process exited with non zero exit code:', code);
                }
                resolve(code);
            });
        } catch (e) {
            return reject(e);
        }
    });
};

module.exports = exec;