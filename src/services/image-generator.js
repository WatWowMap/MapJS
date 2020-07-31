'use strict';

const path = require('path');

const exec = require('./spawn.js');
const utils = require('./utils.js');

const baseDir = path.resolve(__dirname, '../../static/img');
const pokemonDir = path.resolve(baseDir, 'pokemon');
const pokemonLeagueDir = path.resolve(baseDir, 'pokemon_league');
const miscDir = path.resolve(baseDir, 'misc');
const raidDir = path.resolve(baseDir, 'raid');
const gymDir = path.resolve(baseDir, 'gym');
const battleDir = path.resolve(baseDir, 'battle');
const eggDir = path.resolve(baseDir, 'egg');
const unkownEggDir = path.resolve(baseDir, 'unkown_egg');
const pokestopDir = path.resolve(baseDir, 'pokestop');
const itemDir = path.resolve(baseDir, 'item');
const questDir = path.resolve(baseDir, 'quest');
const gruntDir = path.resolve(baseDir, 'grunt');
const invasionDir = path.resolve(baseDir, 'invasion');
const questInvasionDir = path.resolve(baseDir, 'quest_invasion');

const firstFile = path.resolve(miscDir, 'first.png');
const secondFile = path.resolve(miscDir, 'second.png');
const thirdFile = path.resolve(miscDir, 'third.png');

let imageMagick;
if (utils.isWindows()) {
    imageMagick = 'convert.exe';
} else {
    imageMagick = '/usr/local/bin/convert';
}

let composeMethod;
if (process.env['IMAGEGEN_OVER']) {
    composeMethod = 'dst-over';
} else {
    composeMethod = 'over';
}

// TODO: If statements to get correct image
class ImageGenerator {
    static instance = new ImageGenerator();

    constructor() {
    }

    getPokemonImagePath(pokemonId, formId) {
        let pokeId = utils.zeroPad(pokemonId, 3);
        let form = formId === 0 ? '00' : formId;
        return path.resolve(pokemonDir, `pokemon_icon_${pokeId}_${form}.png`);
    }

    async generatePokemonImage(pokemonId, formId, rank) {
        if (await utils.fileExists(pokemonDir) &&
            await utils.fileExists(firstFile) &&
            await utils.fileExists(secondFile) &&
            await utils.fileExists(thirdFile)) {
            try {
                const pokemonFileName = this.getPokemonImagePath(pokemonId, formId);
                if (!pokemonFileName.includes('.png')) {
                    return;
                }
                let pokeId = utils.zeroPad(pokemonId, 3);
                let form = formId === 0 ? '00' : formId;
                switch (rank) {
                    case 1:
                        let newFileFirst = path.resolve(pokemonLeagueDir, pokeId + '_' + form + '_1.png');
                        if (!await utils.fileExists(newFileFirst)) {
                            console.debug(`[ImageGenerator] Creating #1 Pokemon League Images ${pokemonId}`);
                            await this.combineImagesLeague(pokemonFileName, firstFile, newFileFirst);
                        }
                        return newFileFirst;
                    case 2:
                        let newFileSecond = path.resolve(pokemonLeagueDir, pokeId + '_' + form + '_2.png');
                        if (!await utils.fileExists(newFileSecond)) {
                            console.debug(`[ImageGenerator] Creating #2 Pokemon League Images ${pokemonId}`);
                            await this.combineImagesLeague(pokemonFileName, secondFile, newFileSecond);
                        }
                        return newFileSecond;
                    case 3:
                        let newFileThird = path.resolve(pokemonLeagueDir, pokeId + '_' + form + '_3.png');
                        if (!await utils.fileExists(newFileThird)) {
                            console.debug(`[ImageGenerator] Creating #3 Pokemon League Images ${pokemonId}`);
                            await this.combineImagesLeague(pokemonFileName, thirdFile, newFileThird);
                        }
                        return newFileThird;
                    default:
                        return pokemonFileName;
                }
            } catch (e) {
                console.error('[ImageGenerator] Failed to generate iamge:', e);
            }
        } else {
            console.warn('[ImageGenerator] Creating Pokemon League Images (missing Dirs)');
            if (!await utils.fileExists(pokemonDir)) {
                console.log(`[ImageGenerator] Missing dir ${pokemonDir}`);
            }
            if (!await utils.fileExists(firstFile)) {
                console.log(`[ImageGenerator] Missing file ${firstFile}`);
            }
            if (!await utils.fileExists(secondFile)) {
                console.log(`[ImageGenerator] Missing file ${secondFile}`);
            }
            if (!await utils.fileExists(thirdFile)) {
                console.log(`[ImageGenerator] Missing file ${thirdFile}`);
            }
        }
        return null;
    }

    async generateRaidImage(pokemonId, formId, teamId, slots, level) {
        if (await utils.fileExists(raidDir) &&
            await utils.fileExists(gymDir) &&
            await utils.fileExists(eggDir) &&
            await utils.fileExists(unkownEggDir) &&
            await utils.fileExists(pokemonDir)) {
            try {
                let gymFile = path.resolve(gymDir, teamId + '.png');
                if (pokemonId === 0) {
                    if (level > 0) {
                        try {
                            let eggFile = path.resolve(eggDir, level + '.png');
                            let newFile = path.resolve(raidDir, `${teamId}_${slots}_e${level}.png`);
                            if (!utils.fileExists(newFile)) {
                                console.debug(`[ImageGenerator] Creating image for gym ${teamId} and egg ${level}`);
                                await this.combineImages(eggFile, gymFile, composeMethod, newFile);
                            }
                            return newFile;
                        } catch (e) {
                            console.error(e);
                        }
                    } else {
                        try {
                            let unkownEggFile = path.resolve(unkownEggDir, level);
                            let newFile = path.resolve(raidDir, `${teamId}_ue${level}.png`);
                            if (!utils.fileExists(newFile)) {
                                console.debug(`[ImageGenerator] Creating image for gym ${teamId} and unkown egg ${level}`);
                                await this.combineImages(unkownEggFile, gymFile, composeMethod, newFile);
                            }
                            return newFile;
                        } catch (e) {
                            console.error(e);
                        }
                    }
                } else {
                    try {
                        let form = formId === 0 ? '' : '-' + formId;
                        let pokemonFile = this.getPokemonImagePath(pokemonId, formId);
                        let newFile = path.resolve(raidDir, `${teamId}_${slots}_${pokemonId}${form}.png`);
                        if (!utils.fileExists(newFile)) {
                            console.debug(`[ImageGenerator] Creating image for gym ${teamId} and pokemon ${pokemonId}`);
                            await this.combineImages(pokemonFile, gymFile, composeMethod, newFile);
                        }
                        return newFile;
                    } catch (e) {
                        console.error(e);
                    }
                }
            } catch (e) {
                console.error('[ImageGenerator] Error:', e);
            }
        } else {
            console.warn('[ImageGenerator] Not generating Raid Image (missing Dirs)');
            if (!await utils.fileExists(raidDir)) {
                console.log(`[ImageGenerator] Missing dir ${raidDir}`);
            }
            if (!await utils.fileExists(gymDir)) {
                console.log(`[ImageGenerator] Missing dir ${gymDir}`);
            }
            if (!await utils.fileExists(eggDir)) {
                console.log(`[ImageGenerator] Missing dir ${eggDir}`);
            }
            if (!await utils.fileExists(unkownEggDir)) {
                console.log(`[ImageGenerator] Missing dir ${unkownEggDir}`);
            }
            if (!await utils.fileExists(pokemonDir)) {
                console.log(`[ImageGenerator] Missing dir ${pokemonDir}`);
            }
        }
        return null;
    }

    async generateEggImage(level) {
        if (await utils.fileExists(eggDir)) {
            try {
                let eggFile = path.resolve(eggDir, `${level}.png`);
                return eggFile;
            } catch (e) {
                console.error('[ImageGenerator] Error:', e);
            }
        } else {
            console.warn('[ImageGenerator] Not generating Raid Egg Image (missing Dirs)');
            if (!await utils.fileExists(eggDir)) {
                console.log(`[ImageGenerator] Missing dir ${eggDir}`);
            }
        }
        return null;
    }

    async generateGymImage(teamId, slots, inBattle) {
        if (await utils.fileExists(gymDir)) {
            try {
                if (inBattle) {
                    let battleFile = path.resolve(battleDir, `${teamId}_${slots}.png`);
                    return battleFile;
                } else {
                    let gymFile = path.resolve(gymDir, `${teamId}_${slots}.png`);
                    return gymFile;
                }
            } catch (e) {
                console.error('[ImageGenerator] Error:', e);
            }
        } else {
            console.warn('[ImageGenerator] Not generating Gym Image (missing Dirs)');
            if (!await utils.fileExists(gymDir)) {
                console.log(`[ImageGenerator] Missing dir ${gymDir}`);
            }
        }
        return null;
    }

    async generatePokestopImage(pokestopId) {
        if (await utils.fileExists(pokestopDir)) {
            try {
                let pokestopFile = path.resolve(pokestopDir, pokestopId + '.png');
                return pokestopFile;
            } catch (e) {
                console.error(e);
            }
        } else {
            console.warn('[ImageGenerator] Not generating Pokestop Image (missing Dirs)');
            if (!await utils.fileExists(pokestopDir)) {
                console.log(`[ImageGenerator] Missing dir ${pokestopDir}`);
            }
        }
        return null;
    }

    async generateQuestImage(pokemonId, formId, itemId, pokestopId) {
        if (await utils.fileExists(questDir) &&
            await utils.fileExists(itemDir) &&
            await utils.fileExists(pokestopDir) &&
            await utils.fileExists(pokemonDir)) {
            try {
                let pokestopFile = path.resolve(pokestopDir, pokestopId + '.png');
                if (itemId > 0 && pokemonId === 0) {
                    try {
                        let itemFile = path.resolve(itemDir, itemId + '.png');
                        let newFile = path.resolve(questDir, pokestopId + '_i' + itemId + '.png');
                        if (!await utils.fileExists(newFile)) {
                            console.debug(`[ImageGenerator] Creating quest for stop ${pokestopId} and item ${itemId}`);
                            await this.combineImages(itemFile, pokestopFile, composeMethod, newFile);
                        }
                        return newFile;
                    } catch (e) {
                        console.error(e);
                    }
                } else if (itemId === 0 && pokemonId > 0) {
                    try {
                        let pokeId = utils.zeroPad(pokemonId, 3);
                        let form = formId === 0 ? '00' : formId;
                        let pokemonFile = path.resolve(pokemonDir, `pokemon_icon_${pokeId}_${form}.png`);
                        let newFile = path.resolve(questDir, pokestopId + '_p' + pokemonId + '.png');
                        if (!await utils.fileExists(newFile)) {
                            console.debug(`[ImageGenerator] Creating quest for stop ${pokestopId} and pokemon ${pokemonId}`);
                            await this.combineImages(pokemonFile, pokestopFile, composeMethod, newFile);
                        }
                        return newFile;
                    } catch (e) {
                        console.error(e);
                    }
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            console.warn('[ImageGenerator] Not generating Quest Images (missing Dirs)');
            if (!await utils.fileExists(questDir)) {
                console.log(`[ImageGenerator] Missing dir ${questDir}`);
            }
            if (!await utils.fileExists(itemDir)) {
                console.log(`[ImageGenerator] Missing dir ${itemDir}`);
            }
            if (!await utils.fileExists(pokestopDir)) {
                console.log(`[ImageGenerator] Missing dir ${pokestopDir}`);
            }
            if (!await utils.fileExists(pokemonDir)) {
                console.log(`[ImageGenerator] Missing dir ${pokemonDir}`);
            }
        }
        return null;
    }

    async generateInvasionImage(gruntId, pokestopId) {
        if (await utils.fileExists(gruntDir) &&
        await utils.fileExists(pokestopDir)) {
            try {
                let pokestopFile = path.resolve(pokestopDir, 'i' + pokestopId + '.png');
                try {
                    let gruntFile = path.resolve(gruntDir, gruntId + '.png');
                    let newFile = path.resolve(invasionDir, 'i' + pokestopId + '_' + gruntId + '.png');
                    if (!await utils.fileExists(newFile)) {
                        console.debug(`[ImageGenerator] Creating invasion for stop ${pokestopId} and grunt ${gruntId}`);
                        await this.combineImagesGrunt(pokestopFile, gruntFile, newFile);
                    }
                    return newFile;
                } catch (e) {
                    console.error(e);
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            console.warn('[ImageGenerator] Not generating Invasion Image (missing Dirs)');
            if (!await utils.fileExists(gruntDir)) {
                console.log(`[ImageGenerator] Missing dir ${gruntDir}`);
            }
            if (!await utils.fileExists(pokestopDir)) {
                console.log(`[ImageGenerator] Missing dir ${pokestopDir}`);
            }
        }
        return null;
    }

    async generateQuestInvasionImage(pokemonId, formId, itemId, gruntId, questId, pokestopId) {
        if (await utils.fileExists(gruntDir) &&
        await utils.fileExists(questDir)) {
            try {
                //i<pokestop>_[<p/i>-<id>]_<grunt>
                let id;
                if (questId === 1) {
                    id = 'i-2';
                } else if (questId === 2 && itemId) {
                    id = 'i' + itemId;
                } else if (questId === 3) {
                    id = 'i-1';
                } else if (questId === 4 && pokemonId) {
                    id = 'i-3';
                } else if (questId === 7 && pokemonId) {
                    if (formId !== 0 && formId !== null) {
                        id = 'p' + pokemonId + '-' + formId;
                    } else {
                        id = 'p' + pokemonId;
                    }
                } else {
                    id = 'i0';
                }
                let questFile = path.resolve(questDir, id + '.png');
                try {
                    let gruntFile = path.resolve(gruntDir, gruntId + '.png');
                    let newFile = path.resolve(questInvasionDir, `i${pokestopId}_${id}_${gruntId}.png`);
                    console.log('Quest invasion:', newFile);
                    if (!await utils.fileExists(newFile)) {
                        console.debug(`[ImageGenerator] Creating invasion for quest ${id} and grunt ${gruntId}`);
                        await this.combineImagesGruntQuest(questFile, gruntFile, newFile);
                    }
                    return newFile;
                } catch (e) {
                    console.error(e);
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            console.warn('[ImageGenerator] Not generating Quest Invasion Image (missing Dirs)');
            if (!await utils.fileExists(gruntDir)) {
                console.log(`[ImageGenerator] Missing dir ${gruntDir}`);
            }
            if (!await utils.fileExists(questDir)) {
                console.log(`[ImageGenerator] Missing dir ${questDir}`);
            }
        }
        return null;
    }

    async combineImages(image1, image2, method, output) {
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            image1, '-background', 'none',
            '-resize', '96x96',
            '-gravity', 'north',
            '-extent', '96x160',
            'tmp1.png'
        ]);
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            image2, '-background', 'none',
            '-resize', '96x96',
            '-gravity', 'south',
            '-extent', '96x160',
            'tmp2.png'
        ]);
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            'tmp1.png', 'tmp2.png',
            '-gravity', 'center',
            '-compose', method,
            '-composite', output
        ]);
        await this.deleteTempFiles();
        console.debug('[ImageGenerator] Image', output, 'generated...');
    }

    async combineImagesGrunt(image1, image2, output) {
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            image1, '-background', 'none',
            '-resize', '96x96',
            '-gravity', 'center',
            'tmp1.png'
        ]);
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            image2, '-background', 'none',
            '-resize', '64x64',
            '-gravity', 'center',
            'tmp2.png'
        ]);
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            'tmp1.png', 'tmp2.png',
            '-gravity', 'center',
            '-geometry', '+0-19',
            '-compose', 'over',
            '-composite', output
        ]);
        await this.deleteTempFiles();
        console.debug('[ImageGenerator] Image', output, 'generated...');
    }

    async combineImagesGruntQuest(image1, image2, output) {
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            image1, '-background', 'none',
            '-resize', '96x160',
            '-gravity', 'center',
            'tmp1.png'
        ]);
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            image2, '-background', 'none',
            '-resize', '64x64',
            '-gravity', 'center',
            'tmp2.png'
        ]);
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            'tmp1.png', 'tmp2.png',
            '-gravity', 'center',
            '-geometry', '+0+13',
            '-compose', 'over',
            '-composite', output
        ]);
        await this.deleteTempFiles();
        console.debug('[ImageGenerator] Image', output, 'generated...');
    }

    async combineImagesLeague(image1, image2, output) {
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            image1, '-background', 'none',
            '-resize', '96x96',
            '-gravity', 'center',
            'tmp1.png'
        ]);
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            image2, '-background', 'none',
            '-resize', '64x64',
            '-gravity', 'center',
            'tmp2.png'
        ]);
        await exec(imageMagick, [
            '-limit', 'thread', '1',
            'tmp1.png', 'tmp2.png',
            '-gravity', 'SouthWest',
            '-compose', 'over',
            '-composite', output
        ]);
        await this.deleteTempFiles();
        console.debug('[ImageGenerator] Image', output, 'generated...');
    }

    async deleteTempFiles() {
        await exec('rm', '-f', 'tmp1.png');
        await exec('rm', '-f', 'tmp2.png');
    }
}

module.exports = ImageGenerator;