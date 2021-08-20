'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');

const appLocalesFolder = path.resolve(__dirname, '../static/locales');

module.exports.locales = async function locales() {
    const localTranslations = await fs.promises.readdir(appLocalesFolder);
    const englishRef = fs.readFileSync(path.resolve(appLocalesFolder, '_en.json'), { encoding: 'utf8', flag: 'r' });

    await Promise.all(localTranslations.map(async locale => {
        if (locale.startsWith('_')) {
            const mapJsTranslations = fs.readFileSync(path.resolve(appLocalesFolder, locale), { encoding: 'utf8', flag: 'r' });
            const baseName = locale.replace('.json', '').replace('_', '');
            const trimmedRemoteFiles = {};

            try {
                const { data } = await axios.get(`https://raw.githubusercontent.com/WatWowMap/pogo-translations/master/static/locales/${baseName}.json`);

                Object.keys(data).forEach(key => {
                    if (!key.startsWith('desc_') && !key.startsWith('pokemon_category_')) {
                        trimmedRemoteFiles[key] = data[key];
                    }
                });
            } catch (e) {
                console.warn(e, '\n', locale);
            }

            const finalTranslations = {
                ...JSON.parse(englishRef),
                ...JSON.parse(mapJsTranslations),
                ...trimmedRemoteFiles,
            };
            fs.writeFile(
                path.resolve(appLocalesFolder, `${baseName}.json`),
                JSON.stringify(finalTranslations, null, 2),
                'utf8',
                () => { },
            );
            console.log('localeFile', 'file saved.');
        }
    }));
};
