'use strict';

const fs = require('fs');
const path = require('path');

const appLocalesFolder = path.resolve(__dirname, '../static/locales');
const pogoLocalesFolder = path.resolve(__dirname, '../node_modules/pogo-translations/static/locales');

fs.readdir(appLocalesFolder, (err, files) => {
    let pogoLocalesFiles = [];

    if (fs.existsSync(pogoLocalesFolder)) {
        pogoLocalesFiles = fs.readdirSync(pogoLocalesFolder);
    }

    files.filter(file => { return file.startsWith('_'); }).forEach(file => {
        const locale = path.basename(file, '.json').replace('_', '');
        const localeFile = locale + '.json';
        let translations = {};

        console.log('Creating locale', locale);

        if (pogoLocalesFiles.includes(localeFile)) {
            console.log('Found pogo-translations for locale', locale);

            const pogoTranslations = fs.readFileSync(
                path.resolve(pogoLocalesFolder, localeFile),
                { encoding: 'utf8', flag: 'r' }
            );
            translations = JSON.parse(pogoTranslations.toString());
        }

        if (locale !== 'en') {
            // include en as fallback first
            const appTransFallback = fs.readFileSync(
                path.resolve(appLocalesFolder, '_en.json'),
                { encoding: 'utf8', flag: 'r' }
            );
            translations = Object.assign(translations, JSON.parse(appTransFallback.toString()));
        }

        const appTranslations = fs.readFileSync(path.resolve(appLocalesFolder, file), { encoding: 'utf8', flag: 'r' });
        translations = Object.assign(translations, JSON.parse(appTranslations.toString()));

        fs.writeFile(
            path.resolve(appLocalesFolder, localeFile),
            JSON.stringify(translations, null, 2), 
            'utf8', 
            () => {}
        );
        console.log(localeFile, 'file saved.');
    });
});
