// eslint-disable-next-line no-unused-vars
/* global L i18n ga adsbygoogle:writable */

let map;

let lastUpdateServer = 0;

let lastUpdate = 0;
let loadRequest = null;

let pokestopMarkers = [];
let gymMarkers = [];
let pokemonMarkers = [];
let spawnpointMarkers = [];
let cellMarkers = [];
let submissionPlacementCellMarkers = [];
let submissionPlacementRingMarkers = [];
let submissionTypeCellMarkers = [];
let weatherMarkers = [];
let nestMarkers = [];
let deviceMarkers = [];

let pokemonFilter = {};
let pokemonFilterNew = {};

let questFilter = {};
let questFilterNew = {};

let raidFilter = {};
let raidFilterNew = {};

let gymFilter = {};
let gymFilterNew = {};

let pokestopFilter = {};
let pokestopFilterNew = {};

let invasionFilter = {};
let invasionFilterNew = {};

let spawnpointFilter = {};
let spawnpointFilterNew = {};

let nestFilter = {};
let nestFilterNew = {};

let weatherFilter = {};
let weatherFilterNew = {};

let deviceFilter = {};
let deviceFilterNew = {};

let settings = {};
let settingsNew = {};

const hiddenPokemonIds = [];

let openedPokemon;
let openedPokestop;
let openedGym;
let openedCell;
let openedSubmissionTypeCell;
let openedWeather;
let openedNest;
let openedDevice;

let showPokestops;
let showQuests;
let showInvasions;
let showGyms;
let showRaids;
let showPokemon;
let showSpawnpoints;
let showNests;
let showCells;
let showWeather;
let showDevices;
let showScanAreas;
let showRaidTimers;
let showInvasionTimers;
let showSubmissionCells;

let availableForms = [];
let selectedTileserver = 'Default';
let selectedIconStyle = 'Default';

let pokemonFilterLoaded = false;
let questFilterLoaded = false;
let raidFilterLoaded = false;
let gymFilterLoaded = false;
let pokestopFilterLoaded = false;
let invasionFilterLoaded = false;
let spawnpointFilterLoaded = false;
let nestFilterLoaded = false;
let weatherFilterLoaded = false;
let deviceFilterLoaded = false;
let settingsLoaded = false;

let deviceOnlineIcon;
let deviceOfflineIcon;

let clusterPokemon;
let clusterGyms;
let clusterPokestops;

let showPokemonGlow = true;

let tileLayer;
let nestLayer = new L.LayerGroup();
let scanAreaLayer = new L.LayerGroup();

let masterfile = {};
let weatherTypes = {};
let nestsDb = {};
let scanAreasDb = {};
let pokemonGenerationDb = [];

let skipForms = ['Shadow', 'Purified'];

$(function () {
    L.Marker.addInitHook(function () {
        if (this.options.virtual) {
            this.on('add', function () {
                this._updateIconVisibility = function () {
                    if (!this._map) {
                        return;
                    }
                    let map = this._map;
                    let isVisible = map.getBounds().contains(this.getLatLng());
                    let wasVisible = this._wasVisible;
                    let icon = this._icon;
                    let iconParent = this._iconParent;
                    let shadow = this._shadow;
                    let shadowParent = this._shadowParent;

                    if (!iconParent) {
                        iconParent = this._iconParent = icon.parentNode;
                    }
                    if (shadow && !shadowParent) {
                        shadowParent = this._shadowParent = shadow.parentNode;
                    }

                    if (isVisible !== wasVisible) {
                        if (isVisible) {
                            iconParent.appendChild(icon);
                            if (shadow) {
                                shadowParent.appendChild(shadow);
                            }
                        } else {
                            iconParent.removeChild(icon);
                            if (shadow) {
                                shadowParent.removeChild(shadow);
                            }
                        }

                        this._wasVisible = isVisible;
                    }
                };

                this._map.on('resize moveend zoomend', this._updateIconVisibility, this);
                this._updateIconVisibility();
            }, this);
        }
    });

    $.getJSON(`/locales/${locale}.json`, { _: localeLastModified }, function (data) {
        i18n.translator.add(data);
    });

    $.ajaxSetup({
        async: false
    })
    $.getJSON('/data/masterfile.json', function (data) {
        masterfile = data;
    });

    $.getJSON('/data/generation.json', function (data) {
        pokemonGenerationDb = data;
    });

    $.getJSON('/data/weathertypes.json', function (data) {
        weatherTypes = data;
    });
    $.getJSON('/data/cpm.json', function (data) {
        cpMultipliers = data;
    });    
    $.ajaxSetup({
        async: true
    });

    loadStorage();

    // Load available tileservers
    const availableTileserverKeys = Object.keys(availableTileservers);
    availableTileserverKeys.sort();
    $('#select-mapstyle').append($('<option>', {
        value: 'Default',
        text: 'Default',
        selected: selectedTileserver === 'Default'
    }));
    for (let i = 0; i < availableTileserverKeys.length; i++) {
        const key = availableTileserverKeys[i];
        if (key !== 'Default') {
            $('#select-mapstyle').append($('<option>', {
                value: key,
                text: key,
                selected: key === selectedTileserver
            }));
        }
    }

    // Load available icon styles
    const availableIconStyleKeys = Object.keys(availableIconStyles);
    availableIconStyleKeys.sort();
    $('#select-iconstyle').append($('<option>', {
        value: 'Default',
        text: 'Default',
        selected: selectedIconStyle === 'Default'
    }));
    for (let i = 0; i < availableIconStyleKeys.length; i++) {
        const key = availableIconStyleKeys[i];
        if (key !== 'Default') {
            $('#select-iconstyle').append($('<option>', {
                value: key,
                text: key,
                selected: key === selectedIconStyle
            }));
        }
    }

    deviceOnlineIcon = L.icon({
        iconUrl: '/img/device/0.png',
        iconSize: [30, 30],
        iconAnchor: [30 / 2, 30 / 2],
        popupAnchor: [0, 30 * -.6]
    });
    deviceOfflineIcon = L.icon({
        iconUrl: '/img/device/1.png',
        iconSize: [30, 30],
        iconAnchor: [30 / 2, 30 / 2],
        popupAnchor: [0, 30 * -.6]
    });
    
    $('#filtersModal').on('show.bs.modal', function () {
        pokemonFilterNew = $.extend(true, {}, pokemonFilter);
        questFilterNew = $.extend(true, {}, questFilter);
        raidFilterNew = $.extend(true, {}, raidFilter);
        gymFilterNew = $.extend(true, {}, gymFilter);
        pokestopFilterNew = $.extend(true, {}, pokestopFilter);
        invasionFilterNew = $.extend(true, {}, invasionFilter);
        spawnpointFilterNew = $.extend(true, {}, spawnpointFilter);
        nestFilterNew = $.extend(true, {}, nestFilter);
        weatherFilterNew = $.extend(true, {}, weatherFilter);
        deviceFilterNew = $.extend(true, {}, deviceFilter);

        $('.select-button').each(function (button) {
            manageSelectButton($(this), false);
        });
        $('.configure-button').each(function (button) {
            manageConfigureButton($(this), false);
        });

        if (!pokemonFilterLoaded) {
            pokemonFilterLoaded = true;
            loadPokemonFilter();
        }

        if (!questFilterLoaded) {
            questFilterLoaded = true;
            loadQuestFilter();
        }

        if (!raidFilterLoaded) {
            raidFilterLoaded = true;
            loadRaidFilter();
        }

        if (!gymFilterLoaded) {
            gymFilterLoaded = true;
            loadGymFilter();
        }

        if (!pokestopFilterLoaded) {
            pokestopFilterLoaded = true;
            loadPokestopFilter();
        }

        if (!invasionFilterLoaded) {
            invasionFilterLoaded = true;
            loadInvasionFilter();
        }

        if (!spawnpointFilterLoaded) {
            spawnpointFilterLoaded = true;
            loadSpawnpointFilter();
        }

        if (!nestFilterLoaded) {
            nestFilterLoaded = true;
            loadNestFilter();
        }

        if (!weatherFilterLoaded) {
            weatherFilterLoaded = true;
            loadWeatherFilter();
        }

        if (!deviceFilterLoaded) {
            deviceFilterLoaded = true;
            loadDeviceFilter();
        }
    });

    $('#settingsModal').on('show.bs.modal', function () {
        settingsNew = $.extend(true, {}, settings);

        $('.select-button').each(function (button) {
            manageSelectButton($(this), false);
        });
        $('.configure-button').each(function (button) {
            manageConfigureButton($(this), false);
        });

        if (!settingsLoaded) {
            settingsLoaded = true;
            loadSettings();
        }
    });

    // TODO: Bandaid for zindex
    $('#mapstyleModal').on('shown.bs.modal', function () {
        $('#settingsModal').modal('hide');
    });
    $('#iconstyleModal').on('shown.bs.modal', function () {
        $('#settingsModal').modal('hide');
    });

    initMap();

    $('#select-mapstyle').on('change', function () {
        selectedTileserver = this.value;
        store('tileserver', this.value);
        map.removeLayer(tileLayer);

        let scale = '';
        if (L.Browser.retina) {
            scale = '@2x';
        }
        tileLayer = L.tileLayer(availableTileservers[selectedTileserver].url, {
            attribution: availableTileservers[selectedTileserver].attribution,
            minZoom: minZoom,
            maxZoom: maxZoom,
            scale: scale,
            hq: L.Browser.retina
        });
        tileLayer.addTo(map);
    });

    $('#select-iconstyle').on('change', function () {
        selectedIconStyle = this.value;
        store('iconstyle', this.value);

        buildAvailableForms();
        // TODO: Redraw markers/update icons for markers, invalidate map
    });

    $('#exportFilters').on('click', function () {
        let settings = {
            show_gyms: showGyms,
            show_raids: showRaids,
            show_pokemon: showPokemon,
            show_quests: showQuests,
            show_pokestops: showPokestops,
            show_invasions: showInvasions,
            show_spawnpoints: showSpawnpoints,
            show_nests: showNests,
            show_devices: showDevices,
            show_cells: showCells,
            show_submission_cells: showSubmissionCells,
            show_weather: showWeather,
            show_scanareas: showScanAreas,
            gym: gymFilterNew,
            raid: raidFilterNew,
            pokemon: pokemonFilterNew,
            quest: questFilterNew,
            pokestop: pokestopFilterNew,
            invasion: invasionFilterNew,
            spawnpoint: spawnpointFilterNew,
            nest: nestFilterNew,
            weather: weatherFilterNew,
            device: deviceFilterNew,
        };
        let json = JSON.stringify(settings);
        let el = document.createElement('a');
        el.setAttribute('href', 'data:text/plain;chartset=utf-8,' + encodeURIComponent(json));
        el.setAttribute('download', 'settings.json');
        el.style.display = 'none';
        document.body.appendChild(el);
        el.click();
        document.body.removeChild(el);
    });

    $('#importFilters').on('click', function () {
        $('#importFiltersFile').click();
    });

    document.getElementById('importFiltersFile').addEventListener('change', loadFilterSettings, false);

    // If you see this: Don't tell anyone
    let d = new Date();
    if (d.getMonth() === 11 && d.getDate() >= 24 && d.getDate() <= 30) {
        const snow = '<div class="winter-is-coming">\n' +
            '            <div class="snow snow--near"></div>\n' +
            '            <div class="snow snow--near snow--alt"></div>\n' +
            '            <div class="snow snow--mid"></div>\n' +
            '            <div class="snow snow--mid snow--alt"></div>\n' +
            '            <div class="snow snow--far"></div>\n' +
            '            <div class="snow snow--far snow--alt"></div>\n' +
            '        </div>';
        $('#map').append(snow);
    }

    if ((d.getMonth() === 11 && d.getDate() >= 31) || (d.getMonth() === 0 && d.getDate() <= 1)) {
        const fireworks = '<div class="pyro">' +
        '<div class="before"></div>' +
        '<div class="after"></div>' +
        '</div>';
        $('#map').append(fireworks);
    }

    // eslint-disable-next-line no-constant-condition
    if (googleAnalyticsId !== 'false') {
        window.ga = window.ga || function () {
            (ga.q = ga.q || []).push(arguments);
        };
        ga.l = +new Date();
        ga('create', googleAnalyticsId, 'auto');
        ga('send', 'pageview');
    }

    // eslint-disable-next-line no-constant-condition
    if (googleAdsenseId !== 'false') {
        (adsbygoogle = window.adsbygoogle || []).push({
            google_ad_client: googleAdsenseId,
            enable_page_level_ads: true
        });
    }
});


// MARK: - Setup

function buildAvailableForms () {
    availableForms = new Set(availableIconStyles[selectedIconStyle].pokemonList);
}

function loadStorage () {
    const selectedTileserverTmp = retrieve('tileserver');
    if (selectedTileserverTmp === undefined) {
        selectedTileserver = 'Default';
    } else {
        if (availableTileservers[selectedTileserverTmp] === undefined) {
            selectedTileserver = 'Default';
        } else {
            selectedTileserver = selectedTileserverTmp;
        }
    }

    const selectedIconStyleTmp = retrieve('iconstyle');
    if (selectedIconStyleTmp === undefined) {
        selectedIconStyle = 'Default';
    } else {
        if (availableIconStyles[selectedIconStyleTmp] === undefined) {
            selectedIconStyle = 'Default';
        } else {
            selectedIconStyle = selectedIconStyleTmp;
        }
    }
    buildAvailableForms();

    const showGymsValue = retrieve('show_gyms');
    if (showGymsValue === null) {
        store('show_gyms', defaultShowGyms);
        showGyms = defaultShowGyms;
    } else {
        showGyms = (showGymsValue === 'true');
    }

    const showRaidsValue = retrieve('show_raids');
    if (showRaidsValue === null) {
        store('show_raids', defaultShowRaids);
        showRaids = defaultShowRaids;
    } else {
        showRaids = (showRaidsValue === 'true');
    }

    const showRaidTimersValue = retrieve('show_raid_timers');
    if (showRaidTimersValue === null) {
        store('show_raid_timers', defaultShowRaidTimers);
        showRaidTimers = defaultShowRaidTimers;
    } else {
        showRaidTimers = (showRaidTimersValue === 'true');
    }

    const showPokestopsValue = retrieve('show_pokestops');
    if (showPokestopsValue === null) {
        store('show_pokestops', defaultShowPokestops);
        showPokestops = defaultShowPokestops;
    } else {
        showPokestops = (showPokestopsValue === 'true');
    }

    const showQuestsValue = retrieve('show_quests');
    if (showQuestsValue === null) {
        store('show_quests', defaultShowQuests);
        showQuests = defaultShowQuests;
    } else {
        showQuests = (showQuestsValue === 'true');
    }

    const showInvasionsValue = retrieve('show_invasions');
    if (showInvasionsValue === null) {
        store('show_invasions', defaultShowInvasions);
        showInvasions = defaultShowInvasions;
    } else {
        showInvasions = (showInvasionsValue === 'true');
    }

    const showInvasionTimersValue = retrieve('show_invasion_timers');
    if (showInvasionTimersValue === null) {
        store('show_invasion_timers', defaultShowInvasionTimers);
        showInvasionTimers = defaultShowInvasionTimers;
    } else {
        showInvasionTimers = (showInvasionTimersValue === 'true');
    }

    const showSpawnpointsValue = retrieve('show_spawnpoints');
    if (showSpawnpointsValue === null) {
        store('show_spawnpoints', defaultShowSpawnpoints);
        showSpawnpoints = defaultShowSpawnpoints;
    } else {
        showSpawnpoints = (showSpawnpointsValue === 'true');
    }

    const showNestsValue = retrieve('show_nests');
    if (showNestsValue === null) {
        store('show_nests', defaultShowNests);
        showNests = defaultShowNests;
    } else {
        showNests = (showNestsValue === 'true');
    }

    const showPokemonValue = retrieve('show_pokemon');
    if (showPokemonValue === null) {
        store('show_pokemon', defaultShowPokemon);
        showPokemon = defaultShowPokemon;
    } else {
        showPokemon = (showPokemonValue === 'true');
    }

    const showSubmissionCellsValue = retrieve('show_submission_cells');
    if (showSubmissionCellsValue === null) {
        store('show_submission_cells', defaultShowSubmissionCells);
        showSubmissionCells = defaultShowSubmissionCells;
    } else {
        showSubmissionCells = (showSubmissionCellsValue === 'true');
    }

    const showCellsValue = retrieve('show_cells');
    if (showCellsValue === null) {
        store('show_cells', defaultShowScanCells);
        showCells = defaultShowScanCells;
    } else {
        showCells = (showCellsValue === 'true');
    }

    const showWeatherValue = retrieve('show_weather');
    if (showWeatherValue === null) {
        store('show_weather', defaultShowWeather);
        showWeather = defaultShowWeather;
    } else {
        showWeather = (showWeatherValue === 'true');
    }

    const showScanAreasValue = retrieve('show_scanareas');
    if (showScanAreasValue === null) {
        store('show_scanareas', defaultShowScanAreas);
        showScanAreas = defaultShowScanAreas;
    } else {
        showScanAreas = (showScanAreasValue === 'true');
    }

    const showDevicesValue = retrieve('show_devices');
    if (showDevicesValue === null) {
        store('show_devices', defaultShowDevices);
        showDevices = defaultShowDevices;
    } else {
        showDevices = (showDevicesValue === 'true');
    }

    const pokemonFilterValue = retrieve('pokemon_filter');
    if (pokemonFilterValue === null) {
        const defaultPokemonFilter = {};
        for (let i = 1; i <= maxPokemonId; i++) {
            const pkmn = masterfile.pokemon[i];
            const forms = Object.keys(pkmn.forms);
            for (let j = 0; j < forms.length; j++) {
                const formId = forms[j];
                if (skipForms.includes(pkmn.forms[formId].name)) {
                    // Skip Shadow and Purified forms
                    continue;
                }
                const id = formId === '0' ? i : i + '-' + formId;
                defaultPokemonFilter[id] = { show: isCommonPokemon(i) === false, size: 'normal' };
            }
        }
        defaultPokemonFilter.iv_and = { on: pokemonRarity.Default.ivAnd.enabled, filter: pokemonRarity.Default.ivAnd.value };
        defaultPokemonFilter.iv_or = { on: pokemonRarity.Default.ivOr.enabled, filter: pokemonRarity.Default.ivOr.value };
        defaultPokemonFilter.pvp_and = { on: pokemonRarity.Default.pvpAnd.enabled, filter: pokemonRarity.Default.pvpAnd.value };
        defaultPokemonFilter.pvp_or = { on: pokemonRarity.Default.pvpOr.enabled, filter: pokemonRarity.Default.pvpOr.value };
        defaultPokemonFilter.big_karp = { show: false, size: 'normal' };
        defaultPokemonFilter.tiny_rat = { show: false, size: 'normal' };

        store('pokemon_filter', JSON.stringify(defaultPokemonFilter));
        pokemonFilter = defaultPokemonFilter;
    } else {
        pokemonFilter = JSON.parse(pokemonFilterValue);
        for (let i = 1; i <= maxPokemonId; i++) {
            const pkmn = masterfile.pokemon[i];
            const forms = Object.keys(pkmn.forms);
            for (let j = 0; j < forms.length; j++) {
                const formId = forms[j];
                if (skipForms.includes(pkmn.forms[formId].name)) {
                    // Skip Shadow and Purified forms
                    continue;
                }
                const id = formId === '0' ? i : i + '-' + formId;
                if (pokemonFilter[id] === undefined) {
                    pokemonFilter[id] = { show: isCommonPokemon(i) === false, size: 'normal' };
                }
            }
        }
        if (pokemonFilter.iv_and === undefined) {
            pokemonFilter.iv_and = { on: false, filter: '0-100' };
        }
        if (pokemonFilter.iv_or === undefined) {
            pokemonFilter.iv_or = { on: false, filter: '0-100' };
        }
        if (pokemonFilter.pvp_and === undefined) {
            pokemonFilter.pvp_and = { on: false, filter: '1-100' };
        }
        if (pokemonFilter.pvp_or === undefined) {
            pokemonFilter.pvp_or = { on: false, filter: '1-100' };
        }
        if (pokemonFilter.big_karp === undefined) {
            pokemonFilter.big_karp = { show: false, size: 'normal'};
        }
        if (pokemonFilter.tiny_rat === undefined) {
            pokemonFilter.tiny_rat = { show: false, size: 'normal'};
        }
        store('pokemon_filter', JSON.stringify(pokemonFilter));
    }

    const questFilterValue = retrieve('quest_filter');
    if (questFilterValue === null) {
        const defaultQuestFilter = {};
        defaultQuestFilter['candy-count'] = { on: false, filter: '0' };
        defaultQuestFilter['stardust-count'] = { on: false, filter: '0' };
        let i;
        for (i = 0; i < availableQuestRewards.pokemon.length; i++) {
            let id = availableQuestRewards.pokemon[i];
            defaultQuestFilter['p' + id] = { show: true, size: 'normal' };
        }
        $.each(availableItems, function (index, itemId) {
            defaultQuestFilter['i' + itemId] = { show: true, size: 'normal' };
        });
        for (i = 0; i < availableQuestRewards.items.length; i++) {
            let id = availableQuestRewards.items[i];
            defaultQuestFilter['i' + id] = { show: true, size: 'normal' };
        }

        store('quest_filter', JSON.stringify(defaultQuestFilter));
        questFilter = defaultQuestFilter;
    } else {
        questFilter = JSON.parse(questFilterValue);
        if (questFilter['candy-count'] === undefined) {
            questFilter['candy-count'] = { on: false, filter: '0' };
        }
        if (questFilter['stardust-count'] === undefined) {
            questFilter['stardust-count'] = { on: false, filter: '0' };
        }
        let i;
        for (i = 0; i < availableQuestRewards.pokemon.length; i++) {
            let id = availableQuestRewards.pokemon[i];
            if (questFilter['p' + id] === undefined) {
                questFilter['p' + id] = { show: true, size: 'normal' };
            }
        }
        $.each(availableItems, function (index, itemId) {
            if (questFilter['i' + itemId] === undefined) {
                questFilter['i' + itemId] = { show: true, size: 'normal' };
            }
        });
        for (i = 0; i < availableQuestRewards.items.length; i++) {
            let id = availableQuestRewards.items[i];
            if (questFilter['i' + id] === undefined) {
                questFilter['i' + id] = { show: true, size: 'normal' };
            }
        }
        store('quest_filter', JSON.stringify(questFilter));
    }

    const raidFilterValue = retrieve('raid_filter');
    if (raidFilterValue === null) {
        const defaultRaidFilter = {};
        if (defaultRaidFilter.timers === undefined) {
            defaultRaidFilter.timers = { show: defaultShowRaidTimers, size: 'normal' };
        }
        let i;
        for (i = 1; i <= 6; i++) {
            if (defaultRaidFilter['l' + i] === undefined) {
                defaultRaidFilter['l' + i] = { show: true, size: 'normal' };
            }
        }
        for (i = 0; i < availableRaidBosses.length; i++) {
            let poke = availableRaidBosses[i];
            let id = poke.form_id === 0 ? poke.id : poke.id + '-' + poke.form_id;
            if (defaultRaidFilter['p' + id] === undefined) {
                defaultRaidFilter['p' + id] = { show: true, size: 'normal' };
            }
        }

        store('raid_filter', JSON.stringify(defaultRaidFilter));
        raidFilter = defaultRaidFilter;
    } else {
        raidFilter = JSON.parse(raidFilterValue);
        if (raidFilter.timers === undefined) {
            raidFilter.timers = { show: true, size: 'normal' };
            showRaidTimers = true;
        } else {
            showRaidTimers = raidFilter.timers.show;
        }
        let i;
        for (i = 1; i <= 6; i++) {
            if (raidFilter['l' + i] === undefined) {
                raidFilter['l' + i] = { show: true, size: 'normal' };
            }
        }
        for (i = 0; i < availableRaidBosses.length; i++) {
            let poke = availableRaidBosses[i];
            let id = poke.form_id === 0 ? poke.id : poke.id + '-' + poke.form_id;
            if (raidFilter['p' + id] === undefined) {
                raidFilter['p' + id] = { show: true, size: 'normal' };
            }
        }
    }

    const gymFilterValue = retrieve('gym_filter');
    if (gymFilterValue === null) {
        const defaultGymFilter = {};
        let i;
        for (i = 0; i <= 3; i++) {
            if (defaultGymFilter['t' + i] === undefined) {
                defaultGymFilter['t' + i] = { show: true, size: 'normal' };
            }
        }
        if (defaultGymFilter.ex === undefined) {
            defaultGymFilter.ex = { show: false, size: 'normal' };
        }
        if (defaultGymFilter.battle === undefined) {
            defaultGymFilter.battle = { show: false, size: 'normal' };
        }
        for (i = 0; i <= 6; i++) {
            if (defaultGymFilter['s' + i] === undefined) {
                defaultGymFilter['s' + i] = { show: true, size: 'normal' };
            }
        }

        store('gym_filter', JSON.stringify(defaultGymFilter));
        gymFilter = defaultGymFilter;
    } else {
        gymFilter = JSON.parse(gymFilterValue);
        let i;
        for (i = 0; i <= 3; i++) {
            if (gymFilter['t' + i] === undefined) {
                gymFilter['t' + i] = { show: true, size: 'normal' };
            }
        }
        if (gymFilter.ex === undefined) {
            gymFilter.ex = { show: false, size: 'normal' };
        }
        if (gymFilter.battle === undefined) {
            gymFilter.battle = { show: false, size: 'normal' };
        }
        for (i = 0; i <= 6; i++) {
            if (gymFilter['s' + i] === undefined) {
                gymFilter['s' + i] = { show: true, size: 'normal' };
            }
        }
    }

    const pokestopFilterValue = retrieve('pokestop_filter');
    if (pokestopFilterValue === null) {
        const defaultPokestopFilter = {};
        if (defaultPokestopFilter.normal === undefined) {
            defaultPokestopFilter.normal = { show: true, size: 'normal' };
        }
        let i;
        for (i = 1; i < 5; i++) {
            if (defaultPokestopFilter['l' + i] === undefined) {
                defaultPokestopFilter['l' + i] = { show: true, size: 'normal' };
            }
        }

        store('pokestop_filter', JSON.stringify(defaultPokestopFilter));
        pokestopFilter = defaultPokestopFilter;
    } else {
        pokestopFilter = JSON.parse(pokestopFilterValue);
        if (pokestopFilter.normal === undefined) {
            pokestopFilter.normal = { show: true, size: 'normal' };
        }
        let i;
        for (i = 1; i < 5; i++) {
            if (pokestopFilter['l' + i] === undefined) {
                pokestopFilter['l' + i] = { show: true, size: 'normal' };
            }
        }
    }

    const invasionFilterValue = retrieve('invasion_filter');
    if (invasionFilterValue === null) {
        const defaultInvasionFilter = {};
        if (defaultInvasionFilter.timers === undefined) {
            defaultInvasionFilter.timers = { show: defaultShowInvasionTimers, size: 'normal' };
        }
        let i;
        for (i = 1; i <= 50; i++) {
            if (defaultInvasionFilter['i' + i] === undefined) {
                defaultInvasionFilter['i' + i] = { show: true, size: 'normal' };
            }
        }

        store('invasion_filter', JSON.stringify(defaultInvasionFilter));
        invasionFilter = defaultInvasionFilter;
    } else {
        invasionFilter = JSON.parse(invasionFilterValue);
        if (invasionFilter.timers === undefined) {
            invasionFilter.timers = { show: false, size: 'normal' };
            showInvasionTimers = true;
        } else {
            showInvasionTimers = invasionFilter.timers.show;
        }
        let i;
        for (i = 1; i <= 50; i++) {
            if (invasionFilter['i' + i] === undefined) {
                invasionFilter['i' + i] = { show: true, size: 'normal' };
            }
        }
    }

    const spawnpointFilterValue = retrieve('spawnpoint_filter');
    if (spawnpointFilterValue === null) {
        const defaultSpawnpointFilter = {};
        if (defaultSpawnpointFilter['no-timer'] === undefined) {
            defaultSpawnpointFilter['no-timer'] = { show: true, size: 'normal' };
        }
        if (defaultSpawnpointFilter['with-timer'] === undefined) {
            defaultSpawnpointFilter['with-timer'] = { show: true, size: 'normal' };
        }

        store('spawnpoint_filter', JSON.stringify(defaultSpawnpointFilter));
        spawnpointFilter = defaultSpawnpointFilter;
    } else {
        spawnpointFilter = JSON.parse(spawnpointFilterValue);
        if (spawnpointFilter['no-timer'] === undefined) {
            spawnpointFilter['no-timer'] = { show: true, size: 'normal' };
        }
        if (spawnpointFilter['with-timer'] === undefined) {
            spawnpointFilter['with-timer'] = { show: true, size: 'normal' };
        }
    }

    const nestFilterValue = retrieve('nest_filter');
    if (nestFilterValue === null) {
        const defaultNestFilter = {};
        if (defaultNestFilter['avg'] === undefined) {
            defaultNestFilter['avg'] = { on: false, filter: '5' };
        }
        for (let i = 0; i < availableNestPokemon.length; i++) {
            let id = availableNestPokemon[i];
            if (defaultNestFilter['p' + id] === undefined) {
                defaultNestFilter['p' + id] = { show: true, size: 'normal' };
            }
        }
        
        store('nest_filter', JSON.stringify(defaultNestFilter));
        nestFilter = defaultNestFilter;
    } else {
        nestFilter = JSON.parse(nestFilterValue);
        if (nestFilter['avg'] === undefined) {
            nestFilter['avg'] = { on: false, filter: '5-50' };
        }
        for (let i = 0; i < availableNestPokemon.length; i++) {
            let id = availableNestPokemon[i];
            if (nestFilter['p' + id] === undefined) {
                nestFilter['p' + id] = { show: true, size: 'normal' };
            }
        }
    }

    const weatherFilterValue = retrieve('weather_filter');
    if (weatherFilterValue === null) {
        const defaultWeatherFilter = {};
        for (let i = 1; i <= 7; i++) {
            if (defaultWeatherFilter[i] === undefined) {
                defaultWeatherFilter[i] = { show: true, size: 'normal' };
            }
        }
        
        store('weather_filter', JSON.stringify(defaultWeatherFilter));
        weatherFilter = defaultWeatherFilter;
    } else {
        weatherFilter = JSON.parse(weatherFilterValue);
        for (let i = 1; i <= 7; i++) {
            if (weatherFilter[i] === undefined) {
                weatherFilter[i] = { show: true, size: 'normal' };
            }
        }
    }

    const deviceFilterValue = retrieve('device_filter');
    if (deviceFilterValue === null) {
        const defaultDeviceFilter = {};
        if (defaultDeviceFilter['online'] === undefined) {
            defaultDeviceFilter['online'] = { show: true, size: 'normal' };
        }
        if (defaultDeviceFilter['offline'] === undefined) {
            defaultDeviceFilter['offline'] = { show: true, size: 'normal' };
        }

        store('device_filter', JSON.stringify(defaultDeviceFilter));
        deviceFilter = defaultDeviceFilter;
    } else {
        deviceFilter = JSON.parse(deviceFilterValue);
        if (deviceFilter['online'] === undefined) {
            deviceFilter['online'] = { show: true, size: 'normal' };
        }
        if (deviceFilter['offline'] === undefined) {
            deviceFilter['offline'] = { show: true, size: 'normal' };
        }
    }
    
    const settingsValue = retrieve('settings');
    if (settingsValue === null) {
        const defaultSettings = {};
        if (defaultSettings['pokemon-glow'] === undefined) {
            defaultSettings['pokemon-glow'] = { show: true, filter: 'red', color: 'red' };
        }
        if (defaultSettings['pokemon-cluster'] === undefined) {
            defaultSettings['pokemon-cluster'] = { show: clusterPokemon };
        }
        if (defaultSettings['gym-cluster'] === undefined) {
            defaultSettings['gym-cluster'] = { show: clusterGyms };
        }
        if (defaultSettings['pokestop-cluster'] === undefined) {
            defaultSettings['pokestop-cluster'] = { show: clusterPokestops };
        }
        store('settings', JSON.stringify(defaultSettings));
        settings = defaultSettings;
    } else {
        settings = JSON.parse(settingsValue);
        if (settings['pokemon-glow'] === undefined) {
            settings['pokemon-glow'] = { show: true, filter: 'red', color: 'red' };
        }
        if (settings['pokemon-cluster'] === undefined) {
            settings['pokemon-cluster'] = { show: true };
        }
        if (settings['gym-cluster'] === undefined) {
            settings['gym-cluster'] = { show: true };
        }
        if (settings['pokestop-cluster'] === undefined) {
            settings['pokestop-cluster'] = { show: true };
        }
    }
    clusterPokemon = settings['pokemon-cluster'].show;
    clusterGyms = settings['gym-cluster'].show;
    clusterPokestops = settings['pokestop-cluster'].show;
    showPokemonGlow = settings['pokemon-glow'].show;
}

function initMap () {
    map = L.map('map', {
        preferCanvas: true,
        //worldCopyJump: true,
        updateWhenIdle: true,
        updateWhenZooming: false,
        layers: [nestLayer, scanAreaLayer, clusters],
        maxZoom: maxZoom,
        //renderer: L.canvas()
    });

    const lastViewCenterLat = retrieve('last_lat');
    const lastViewCenterLng = retrieve('last_lng');
    const lastViewZoom = retrieve('last_zoom');
    if (window.location.pathname == '/' && lastViewCenterLat && lastViewCenterLng && lastViewZoom) {
        map.setView([lastViewCenterLat, lastViewCenterLng], lastViewZoom);
    } else {
        map.setView(defaultStartLocation, defaultStartZoom);
    }
    map.on('moveend', function () {
        const center = map.getCenter();
        store('last_lat', center.lat);
        store('last_lng', center.lng);
        store('last_zoom', map.getZoom());
    });

    let scale = '';
    if (L.Browser.retina) {
        scale = '@2x';
    }
    tileLayer = L.tileLayer(availableTileservers[selectedTileserver].url, {
        attribution: availableTileservers[selectedTileserver].attribution,
        minZoom: minZoom,
        maxZoom: maxZoom,
        scale: scale,
        hq: L.Browser.retina
    });
    tileLayer.addTo(map);

    L.control.locate({
        icon: 'fas fa-crosshairs',
        setView: 'untilPan',
        keepCurrentZoomLevel: true,
    }).addTo(map);

    registerFilterButtonCallbacks();

    $('#saveFilters').on('click', function (event) {
        $(this).toggleClass('active');

        const newShowGyms = $('#show-gyms').hasClass('active');
        const newShowRaids = $('#show-raids').hasClass('active');
        const newShowPokestops = $('#show-pokestops').hasClass('active');
        const newShowInvasions = $('#show-invasions').hasClass('active');
        const newShowQuests = $('#show-quests').hasClass('active');
        const newShowPokemon = $('#show-pokemon').hasClass('active');
        const newShowSpawnpoints = $('#show-spawnpoints').hasClass('active');
        const newShowNests = $('#show-nests').hasClass('active');
        const newShowCells = $('#show-cells').hasClass('active');
        const newShowSubmissionCells = $('#show-submission-cells').hasClass('active');
        const newShowWeather = $('#show-weather').hasClass('active');
        const newShowScanAreas = $('#show-scanareas').hasClass('active');
        const newShowDevices = $('#show-devices').hasClass('active');

        const ts = Math.round((new Date()).getTime() / 1000);

        if (newShowGyms !== showGyms && newShowGyms === false) {
            const newGymMarkers = [];
            $.each(gymMarkers, function (index, gym) {
                if (newShowRaids && gym.raid_end_timestamp >= ts) {
                    newGymMarkers.push(gym);
                } else {
                    if (clusterGyms) {
                        clusters.removeLayer(gym.marker);
                    } else {
                        map.removeLayer(gym.marker);
                    }
                }
            });

            gymMarkers = newGymMarkers;
        }
        if (newShowPokemon !== showPokemon) {
            $.each(pokemonMarkers, function (index, pokemon) {
                if (clusterPokemon) {
                    clusters.removeLayer(pokemon.marker);
                } else {
                    map.removeLayer(pokemon.marker);
                }
            });
            pokemonMarkers = [];
        }
        if (newShowRaids !== showRaids) {
            $.each(gymMarkers, function (index, gym) {
                if (clusterGyms) {
                    clusters.removeLayer(gym.marker);
                } else {
                    map.removeLayer(gym.marker);
                }
            });
            gymMarkers = [];
        }
        if (newShowPokestops !== showPokestops && newShowPokestops === false) {
            $.each(pokestopMarkers, function (index, pokestop) {
                if (clusterPokestops) {
                    clusters.removeLayer(pokestop.marker);
                } else {
                    map.removeLayer(pokestop.marker);
                }
            });
            pokestopMarkers = [];
        }
        if (newShowInvasions !== showInvasions && newShowInvasions === false) {
            $.each(pokestopMarkers, function (index, pokestop) {
                if (clusterPokestops) {
                    clusters.removeLayer(pokestop.marker);
                } else {
                    map.removeLayer(pokestop.marker);
                }
            });
            pokestopMarkers = [];
        }
        if (newShowQuests !== showQuests) {
            $.each(pokestopMarkers, function (index, pokestop) {
                if (clusterPokestops) {
                    clusters.removeLayer(pokestop.marker);
                } else {
                    map.removeLayer(pokestop.marker);
                }
            });
            pokestopMarkers = [];
        }
        if (newShowSpawnpoints !== showSpawnpoints && newShowSpawnpoints === false) {
            $.each(spawnpointMarkers, function (index, spawnpoint) {
                map.removeLayer(spawnpoint.marker);
            });
            spawnpointMarkers = [];
        }
        // TODO: Fix nest filtering on change
        //if (newShowNests !== showNests && newShowNests === false) {
            nestLayer.clearLayers();
            nestMarkers = [];
        //}
        if (newShowCells !== showCells && newShowCells === false) {
            $.each(cellMarkers, function (index, cell) {
                map.removeLayer(cell.marker);
            });
            cellMarkers = [];
        }
        if (newShowSubmissionCells !== showSubmissionCells && newShowSubmissionCells === false) {
            $.each(submissionPlacementCellMarkers, function (index, cell) {
                map.removeLayer(cell.marker);
            });
            submissionPlacementCellMarkers = [];
            $.each(submissionPlacementRingMarkers, function (index, ring) {
                map.removeLayer(ring.marker);
            });
            submissionPlacementRingMarkers = [];
            $.each(submissionTypeCellMarkers, function (index, cell) {
                map.removeLayer(cell.marker);
            });
            submissionTypeCellMarkers = [];
        }
        // TODO: Fix weather filtering on change
        //if (newShowWeather !== showWeather && newShowWeather === false) {
            $.each(weatherMarkers, function (index, weather) {
                map.removeLayer(weather.marker);
            });
            weatherMarkers = [];
        //}
        if (/*newShowScanAreas !== showScanAreas &&*/ newShowScanAreas === false) {
            scanAreaLayer.clearLayers();
        } else {
            loadScanAreaPolygons();
        }
        // TODO: Fix
        //if (newShowDevices !== showDevices && newShowDevices === false) {
            $.each(deviceMarkers, function (index, device) {
                map.removeLayer(device.marker);
            });
            deviceMarkers = [];
        //}

        pokemonFilter = pokemonFilterNew;
        const newPokemonMarkers = [];
        $.each(pokemonMarkers, function (index, pokemon) {
            if (clusterPokemon) {
                clusters.removeLayer(pokemon.marker);
            } else {
                map.removeLayer(pokemon.marker);
            }
        });
        pokemonMarkers = newPokemonMarkers;

        questFilter = questFilterNew;
        const newPokestopMarkers = [];
        $.each(pokestopMarkers, function (index, pokestop) {
            if (clusterPokestops) {
                clusters.removeLayer(pokestop.marker);
            } else {
                map.removeLayer(pokestop.marker);
            }
        });
        pokestopMarkers = newPokestopMarkers;

        const newSpawnpointMarkers = [];
        $.each(spawnpointMarkers, function (index, spawnpoint) {
            map.removeLayer(spawnpoint.marker);
        });
        spawnpointMarkers = newSpawnpointMarkers;

        gymFilter = gymFilterNew;
        pokestopFilter = pokestopFilterNew;
        invasionFilter = invasionFilterNew;
        raidFilter = raidFilterNew;
        spawnpointFilter = spawnpointFilterNew;
        nestFilter = nestFilterNew;
        weatherFilter = weatherFilterNew;
        deviceFilter = deviceFilterNew;

        const newGymMarkers = [];
        $.each(gymMarkers, function (index, gym) {
            if (clusterGyms) {
                clusters.removeLayer(gym.marker);
            } else {
                map.removeLayer(gym.marker);
            }
        });
        gymMarkers = newGymMarkers;

        const newShowRaidTimers = raidFilter.timers.show;
        if (newShowRaidTimers !== showRaidTimers) {
            showRaidTimers = newShowRaidTimers;
        }

        const newShowInvasionTimers = invasionFilter.timers.show;
        if (newShowInvasionTimers !== showInvasionTimers) {
            showInvasionTimers = newShowInvasionTimers;
        }

        showGyms = newShowGyms;
        store('show_gyms', newShowGyms);
        store('gym_filter', JSON.stringify(gymFilter));

        showRaids = newShowRaids;
        store('show_raids', newShowRaids);
        store('raid_filter', JSON.stringify(raidFilter));

        showPokestops = newShowPokestops;
        store('show_pokestops', newShowPokestops);
        store('pokestop_filter', JSON.stringify(pokestopFilter));

        showQuests = newShowQuests;
        store('show_quests', newShowQuests);
        store('quest_filter', JSON.stringify(questFilter));

        showPokemon = newShowPokemon;
        store('show_pokemon', newShowPokemon);
        store('pokemon_filter', JSON.stringify(pokemonFilter));

        showInvasions = newShowInvasions;
        store('show_invasions', newShowInvasions);
        store('invasion_filter', JSON.stringify(invasionFilter));

        showSpawnpoints = newShowSpawnpoints;
        store('show_spawnpoints', newShowSpawnpoints);
        store('spawnpoint_filter', JSON.stringify(spawnpointFilter));

        showNests = newShowNests;
        store('show_nests', newShowNests);
        store('nest_filter', JSON.stringify(nestFilter));

        showCells = newShowCells;
        store('show_cells', newShowCells);

        showSubmissionCells = newShowSubmissionCells;
        store('show_submission_cells', newShowSubmissionCells);

        showWeather = newShowWeather;
        store('show_weather', newShowWeather);
        store('weather_filter', JSON.stringify(weatherFilter));

        showScanAreas = newShowScanAreas;
        store('show_scanareas', newShowScanAreas);
    
        showDevices = newShowDevices;
        store('show_devices', newShowDevices);
        store('device_filter', JSON.stringify(deviceFilter));

        store('show_raid_timers', newShowRaidTimers);
        store('show_invasion_timers', newShowInvasionTimers);

        lastUpdateServer = 0;
        loadData();

        $('#filtersModal').modal('hide');
    });
    
    $('#saveSettings').on('click', function (event) {
        $(this).toggleClass('active');

        settings = settingsNew;
        store('settings', JSON.stringify(settings));

        const newClusterPokemon = settingsNew['pokemon-cluster'].show;
        const newShowPokemonGlow = settingsNew['pokemon-glow'].show;
        if (clusterPokemon !== newClusterPokemon ||
            showPokemonGlow !== newShowPokemonGlow) {
            $.each(pokemonMarkers, function (index, pokemon) {
                if (clusterPokemon) {
                    clusters.removeLayer(pokemon.marker);
                } else {
                    map.removeLayer(pokemon.marker);
                }
            });
            pokemonMarkers = [];
        }
        const newClusterGyms = settingsNew['gym-cluster'].show;
        if (clusterGyms !== newClusterGyms) {
            $.each(gymMarkers, function (index, gym) {
                if (clusterGyms) {
                    clusters.removeLayer(gym.marker);
                } else {
                    map.removeLayer(gym.marker);
                }
            });
        }
        const newClusterPokestops = settingsNew['pokestop-cluster'].show;
        if (clusterPokestops !== newClusterPokestops) {
            $.each(pokestopMarkers, function (index, pokestop) {
                if (clusterPokestops) {
                    clusters.removeLayer(pokestop.marker);
                } else {
                    map.removeLayer(pokestop.marker);
                }
            });
            pokestopMarkers = [];
        }
        clusterPokemon = newClusterPokemon;
        showPokemonGlow = newShowPokemonGlow;
        //pokemonGlowColor = settings['pokemon-glow'].color;
        clusterGyms = newClusterGyms;
        clusterPokestops = newClusterPokestops;

        $('#settingsModal').modal('hide');
    });

    $('input[id="search-reward"], input[id="search-nest"], input[id="search-gym"], input[id="search-pokestop"]').bind('input', function (e) {
        let input = e.target;
        if (input) {
            loadSearchData(input.id, input.value);
        }
    });

    $('#saveSettings').on('click', function (event) {
        $(this).toggleClass('active');
        settings = settingsNew;
        store('settings', JSON.stringify(settings));

        //console.log('settings:', settings);
        const newClusterPokemon = settings['pokemon-cluster'].show;
        const newShowPokemonGlow = settings['pokemon-glow'].show;
        if (clusterPokemon !== newClusterPokemon ||
            showPokemonGlow !== newShowPokemonGlow) {
            $.each(pokemonMarkers, function (index, pokemon) {
                if (clusterPokemon) {
                    clusters.removeLayer(pokemon.marker);
                } else {
                    map.removeLayer(pokemon.marker);
                }
            });
            pokemonMarkers = [];
        }
        const newClusterGyms = settingsNew['gym-cluster'].show;
        if (clusterGyms !== newClusterGyms) {
            $.each(gymMarkers, function (index, gym) {
                if (clusterGyms) {
                    clusters.removeLayer(gym.marker);
                } else {
                    map.removeLayer(gym.marker);
                }
            });
        }
        const newClusterPokestops = settingsNew['pokestop-cluster'].show;
        if (clusterPokestops !== newClusterPokestops) {
            $.each(pokestopMarkers, function (index, pokestop) {
                if (clusterPokestops) {
                    clusters.removeLayer(pokestop.marker);
                } else {
                    map.removeLayer(pokestop.marker);
                }
            });
            pokestopMarkers = [];
        }
        clusterPokemon = newClusterPokemon;
        showPokemonGlow = newShowPokemonGlow;
        //pokemonGlowColor = settings['pokemon-glow'].color;
        clusterGyms = newClusterGyms;
        clusterPokestops = newClusterPokestops;

        $('#settingsModal').modal('hide');
    });

    $('input[id="search-reward"], input[id="search-nest"], input[id="search-gym"], input[id="search-pokestop"]').bind('input', function (e) {
        let input = e.target;
        if (input) {
            loadSearchData(input.id, input.value);
        }
    });

    $('#saveSettings').on('click', function (event) {
        $(this).toggleClass('active');
        settings = settingsNew;
        store('settings', JSON.stringify(settings));

        //console.log('settings:', settings);
        const newClusterPokemon = settings['pokemon-cluster'].show;
        const newShowPokemonGlow = settings['pokemon-glow'].show;
        if (clusterPokemon !== newClusterPokemon ||
            showPokemonGlow !== newShowPokemonGlow) {
            $.each(pokemonMarkers, function (index, pokemon) {
                if (clusterPokemon) {
                    clusters.removeLayer(pokemon.marker);
                } else {
                    map.removeLayer(pokemon.marker);
                }
            });
            pokemonMarkers = [];
        }
        const newClusterGyms = settingsNew['gym-cluster'].show;
        if (clusterGyms !== newClusterGyms) {
            $.each(gymMarkers, function (index, gym) {
                if (clusterGyms) {
                    clusters.removeLayer(gym.marker);
                } else {
                    map.removeLayer(gym.marker);
                }
            });
        }
        const newClusterPokestops = settingsNew['pokestop-cluster'].show;
        if (clusterPokestops !== newClusterPokestops) {
            $.each(pokestopMarkers, function (index, pokestop) {
                if (clusterPokestops) {
                    clusters.removeLayer(pokestop.marker);
                } else {
                    map.removeLayer(pokestop.marker);
                }
            });
            pokestopMarkers = [];
        }
        clusterPokemon = newClusterPokemon;
        showPokemonGlow = newShowPokemonGlow;
        //pokemonGlowColor = settings['pokemon-glow'].color;
        clusterGyms = newClusterGyms;
        clusterPokestops = newClusterPokestops;

        $('#settingsModal').modal('hide');
    });

    $('input[id="search-reward"], input[id="search-nest"], input[id="search-gym"], input[id="search-pokestop"]').bind('input', function (e) {
        let input = e.target;
        if (input) {
            loadSearchData(input.id, input.value);
        }
    });

    const CustomControlFilters = L.Control.extend({
        options: {
            position: 'topleft'
        },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.innerHTML = '<a href="#"><i class="fas fa-filter" style="width: 21px; height: 21px;" class="center-block;"></i></a>';
            container.onclick = function () {
                if (retrieve('show_gyms') === 'true') {
                    $('#show-gyms').addClass('active');
                    $('#hide-gyms').removeClass('active');
                } else {
                    $('#hide-gyms').addClass('active');
                    $('#show-gyms').removeClass('active');
                }

                if (retrieve('show_raids') === 'true') {
                    $('#show-raids').addClass('active');
                    $('#hide-raids').removeClass('active');
                } else {
                    $('#hide-raids').addClass('active');
                    $('#show-raids').removeClass('active');
                }

                if (retrieve('show_pokestops') === 'true') {
                    $('#show-pokestops').addClass('active');
                    $('#hide-pokestops').removeClass('active');
                } else {
                    $('#hide-pokestops').addClass('active');
                    $('#show-pokestops').removeClass('active');
                }

                if (retrieve('show_invasions') === 'true') {
                    $('#show-invasions').addClass('active');
                    $('#hide-invasions').removeClass('active');
                } else {
                    $('#hide-invasions').addClass('active');
                    $('#show-invasions').removeClass('active');
                }

                if (retrieve('show_quests') === 'true') {
                    $('#show-quests').addClass('active');
                    $('#hide-quests').removeClass('active');
                } else {
                    $('#hide-quests').addClass('active');
                    $('#show-quests').removeClass('active');
                }

                if (retrieve('show_pokemon') === 'true') {
                    $('#show-pokemon').addClass('active');
                    $('#hide-pokemon').removeClass('active');
                } else {
                    $('#hide-pokemon').addClass('active');
                    $('#show-pokemon').removeClass('active');
                }

                if (retrieve('show_spawnpoints') === 'true') {
                    $('#show-spawnpoints').addClass('active');
                    $('#hide-spawnpoints').removeClass('active');
                } else {
                    $('#hide-spawnpoints').addClass('active');
                    $('#show-spawnpoints').removeClass('active');
                }

                if (retrieve('show_nests') == 'true') {
                    $('#show-nests').addClass('active');
                    $('#hide-nests').removeClass('active');
                } else {
                    $('#hide-nests').addClass('active');
                    $('#show-nests').removeClass('active');
                }

                if (retrieve('show_cells') === 'true') {
                    $('#show-cells').addClass('active');
                    $('#hide-cells').removeClass('active');
                } else {
                    $('#hide-cells').addClass('active');
                    $('#show-cells').removeClass('active');
                }

                if (retrieve('show_submission_cells') === 'true') {
                    $('#show-submission-cells').addClass('active');
                    $('#hide-submission-cells').removeClass('active');
                } else {
                    $('#hide-submission-cells').addClass('active');
                    $('#show-submission-cells').removeClass('active');
                }

                if (retrieve('show_weather') === 'true') {
                    $('#show-weather').addClass('active');
                    $('#hide-weather').removeClass('active');
                } else {
                    $('#hide-weather').addClass('active');
                    $('#show-weather').removeClass('active');
                }

                if (retrieve('show_scanareas') === 'true') {
                    $('#show-scanareas').addClass('active');
                    $('#hide-scanareas').removeClass('active');
                } else {
                    $('#hide-scanareas').addClass('active');
                    $('#show-scanareas').removeClass('active');
                }

                if (retrieve('show_devices') === 'true') {
                    $('#show-devices').addClass('active');
                    $('#hide-devices').removeClass('active');
                } else {
                    $('#hide-devices').addClass('active');
                    $('#show-devices').removeClass('active');
                }

                $('#filtersModal').modal('show');
            };

            return container;
        }
    });
    map.addControl(new CustomControlFilters());

    const CustomControlSettings = L.Control.extend({
        options: {
            position: 'bottomleft'
        },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.innerHTML = '<a href="#"><i class="fas fa-cog" style="width: 21px; height: 21px;" class="center-block"></i></a>';
            container.onclick = function () {
                $('#settingsModal').modal('show');
            };

            return container;
        }
    });
    map.addControl(new CustomControlSettings());

    const CustomControlSearch = L.Control.extend({
        options: {
            position: 'topleft'
        },
        onAdd: function (map) {
            const container = L.DomUtil.create('div', 'leaflet-bar leaflet-control leaflet-control-custom');
            container.innerHTML = '<a href="#"><i class="fas fa-search" style="width: 21px; height: 21px;" class="center-block"></i></a>';
            container.onclick = function () {
                $('#searchModal').modal('show');
            };

            return container;
        }
    });
    map.addControl(new CustomControlSearch());

    map.on('zoomend', function () {
        if (showCells && map.getZoom() < 13) {
            $.each(cellMarkers, function (index, cell) {
                map.removeLayer(cell.marker);
            });
            cellMarkers = [];
        }

        if (showSubmissionCells && map.getZoom() < 16) {
            $.each(submissionPlacementCellMarkers, function (index, cell) {
                map.removeLayer(cell.marker);
            });
            submissionPlacementCellMarkers = [];
            $.each(submissionPlacementRingMarkers, function (index, ring) {
                map.removeLayer(ring.marker);
            });
            submissionPlacementRingMarkers = [];
        }

        if (showSubmissionCells && map.getZoom() < 14) {
            $.each(submissionTypeCellMarkers, function (index, cell) {
                map.removeLayer(cell.marker);
            });
            submissionTypeCellMarkers = [];
        }

        lastUpdateServer = 0;
        loadData();
    });

    map.on('moveend', function () {
        lastUpdateServer = 0;
        loadData();
    });

    loadData();
    setInterval(loadData, 10 * 1000);
    setInterval(updateOpenedPopupLoop, 1000);
    setInterval(updateCellsLoop, 10000);
    setInterval(updateDevicesLoop, 10000);
    setInterval(updateMapTimers, 1000);

    $.getJSON( '/custom/nests.json', function( data ) {
        nestsDb = data;
    });

    $.getJSON( '/custom/areas.json', function( data ) {
        scanAreasDb = data;
        if (showScanAreas) {
            loadScanAreaPolygons();
        }
    });
}

function loadSearchData (id, value) {
    let center = map.getCenter();
    let elementId = `#${id}-list`;
    if (!value) {
        $(elementId).hide();
        return;
    }
    $.ajax({
        url: '/api/search',
        type: 'POST',
        data: {
            id: id,
            value: value,
            lat: center.lat,
            lon: center.lng,
            icon_style: selectedIconStyle
        },
        timeout: 30000,
        dataType: 'json',
        success: function(result) {
            if (result === null || result.data === null) {
                $(elementId).hide();
                return;
            }
            let html = '<ul id="search-list" class="list-group">';
            for (let i = 0; i < result.data.length; i++) {
                const item = result.data[i];
                html += '<li class="list-group-item list-group-item-action" style="padding: 0 0 0 0; background-color: rgb(33, 37, 31); border: 1px solid black">';
                html += `<img src='${item.url}' width='24' height='auto' />&nbsp;`;
                if (item.url2) {
                    html += `<img src='${item.url2}' width='24' height='auto' />&nbsp;`;
                }
                html += `<a href="#" onclick="centerOnMap(${item.lat}, ${item.lon});">${item.name} - ${item.distance} km away</a>`;
                html += '</li>';
            }
            html += '</ul>';
            $(elementId).show();
            $(elementId).html(html);
        }
    });
}

function centerOnMap(lat, lon) {
    $('#searchModal').modal('toggle');
    let latlng = new L.LatLng(lat, lon);
    let zoom = maxZoom;
    map.setView(latlng, zoom);
    // TODO: Click marker popup? Search markers, if lat/lon same open popup
}


// MARK: - Data Loading

function loadData () {
    if (new Date() - lastUpdate < (loadRequest ? 4000 : 500)) {
        return;
    }
    if (loadRequest) {
        loadRequest.abort();
	}
    lastUpdate = new Date();

    const bounds = map.getBounds();

    const pokemonFilterExclude = [];
    const pokemonFilterIV = {};
    const pokemonFilterPVP = {};
    if (showPokemon) {
        for (let i = 1; i <= maxPokemonId; i++) {
            const pkmn = masterfile.pokemon[i];
            const forms = Object.keys(pkmn.forms);
            for (let j = 0; j < forms.length; j++) {
                const formId = forms[j];
                if (skipForms.includes(pkmn.forms[formId].name)) {
                    // Skip Shadow and Purified forms
                    continue;
                }
                const id = formId === '0' ? i : i + '-' + formId;
                if (pokemonFilter[id].show === false) {
                    pokemonFilterExclude.push(id);
                }
                if (pokemonFilter[id].show === 'filter') {
                    pokemonFilterIV[id] = pokemonFilter[id].filter.replace(/\s/g, '');
                }
            }
        }

        if (pokemonFilter.iv_and.on === true) {
            pokemonFilterIV.and = pokemonFilter.iv_and.filter.replace(/\s/g, '');
        }

        if (pokemonFilter.iv_or.on === true) {
            pokemonFilterIV.or = pokemonFilter.iv_or.filter.replace(/\s/g, '');
        }

        if (pokemonFilter.pvp_and.on === true) {
            pokemonFilterPVP.and = pokemonFilter.pvp_and.filter.replace(/\s/g, '');
        }

        if (pokemonFilter.pvp_or.on === true) {
            pokemonFilterPVP.or = pokemonFilter.pvp_or.filter.replace(/\s/g, '');
        }

        if (pokemonFilter.big_karp.show !== false) {
            pokemonFilterExclude.push("big_karp");
        }

        if (pokemonFilter.tiny_rat.show !== false) {
            pokemonFilterExclude.push("tiny_rat");
        }
    }

    const questFilterExclude = [];
    if (showQuests) {
        if (questFilter['candy-count'].on === true) {
            questFilterExclude.push('candy' + questFilter['candy-count'].filter.replace(/\s/g, ''));
        }
        if (questFilter['stardust-count'].on === true) {
            questFilterExclude.push('stardust' + questFilter['stardust-count'].filter.replace(/\s/g, ''));
        }
        let i;
        for (i = 0; i < availableQuestRewards.pokemon.length; i++) {
            let id = availableQuestRewards.pokemon[i];
            if (questFilter['p' + id].show === false) {
                questFilterExclude.push('p' + id);
            }
        }
        $.each(availableItems, function (index, itemId) {
            if (questFilter['i' + itemId].show === false) {
                questFilterExclude.push('i' + itemId);
            }
        });
        for (i = 0; i < availableQuestRewards.items.length; i++) {
            let id = availableQuestRewards.items[i];
            if (questFilter['i' + id].show === false) {
                questFilterExclude.push('i' + id);
            }
        }
    }

    const raidFilterExclude = [];
    if (showRaids) {
        // REVIEW: Probably not needed
        if (raidFilter.timers.show === false) {
            raidFilterExclude.push('timers');
        }
        let i;
        for (i = 1; i <= 6; i++) {
            if (raidFilter['l' + i].show === false) {
                raidFilterExclude.push('l' + i);
            }
        }
        for (i = 0; i < availableRaidBosses.length; i++) {
            let poke = availableRaidBosses[i];
            let id = poke.form_id === 0 ? poke.id : poke.id + '-' + poke.form_id;
            if (raidFilter['p' + id].show === false) {
                raidFilterExclude.push('p' + id);
            }
        }
    }

    const gymFilterExclude = [];
    if (showGyms || showRaids) {
        let i;
        for (i = 0; i <= 3; i++) {
            if (gymFilter['t' + i].show === false) {
                gymFilterExclude.push('t' + i);
            }
        }
        if (gymFilter.ex.show !== false) {
            gymFilterExclude.push('ex');
        }
        if (gymFilter.battle.show !== false) {
            gymFilterExclude.push('battle');
        }
        for (i = 0; i <= 6; i++) {
            if (gymFilter['s' + i].show === false) {
                gymFilterExclude.push('s' + i);
            }
        }
    }

    const pokestopFilterExclude = [];
    if (showPokestops) {
        if (pokestopFilter.normal.show === false) {
            pokestopFilterExclude.push('normal');
        }
        for (let i = 1; i < 5; i++) {
            if (pokestopFilter['l' + i].show === false) {
                pokestopFilterExclude.push('l' + i);
            }
        }
    }

    const invasionFilterExclude = [];
    if (showInvasions) {
        for (let i = 1; i <= 50; i++) {
            if (invasionFilter['i' + i].show === false) {
                invasionFilterExclude.push('i' + i);
            }
        }
    }

    const spawnpointFilterExclude = [];
    if (showSpawnpoints) {
        if (spawnpointFilter['no-timer'].show === false) {
            spawnpointFilterExclude.push('no-timer');
        }
        if (spawnpointFilter['with-timer'].show === false) {
            spawnpointFilterExclude.push('with-timer');
        }
    }

    const nestFilterExclude = [];
    if (showNests) {
        if (nestFilter['avg'].on === true) {
            nestFilterExclude.push('avg' + nestFilter['avg'].filter.replace(/\s/g, ''));
        }
        for (let i = 0; i < availableNestPokemon.length; i++) {
            let id = availableNestPokemon[i];
            if (nestFilter['p' + id].show === false) {
                nestFilterExclude.push('p' + id);
            }
        }
    }

    const weatherFilterExclude = [];
    if (showWeather) {
        for (let i = 1; i <= 7; i++) {
            if (weatherFilter[i].show === false) {
                weatherFilterExclude.push(i);
            }
        }
    }

    const deviceFilterExclude = [];
    if (showDevices) {
        if (deviceFilter['online'].show === false) {
            deviceFilterExclude.push('online');
        }
        if (deviceFilter['offline'].show === false) {
            deviceFilterExclude.push('offline');
        }
    }

    const data = {
        _: Math.round((new Date()).getTime() / 1000),
        min_lat: bounds._southWest.lat,
        max_lat: bounds._northEast.lat,
        min_lon: bounds._southWest.lng,
        max_lon: bounds._northEast.lng,
        show_gyms: showGyms,
        show_raids: showRaids,
        show_pokestops: showPokestops,
        show_quests: showQuests,
        show_invasions: showInvasions,
        show_pokemon: showPokemon,
        pokemon_filter_exclude: JSON.stringify(pokemonFilterExclude),
        quest_filter_exclude: JSON.stringify(questFilterExclude),
        pokemon_filter_iv: JSON.stringify(pokemonFilterIV),
        pokemon_filter_pvp: JSON.stringify(pokemonFilterPVP),
        raid_filter_exclude: JSON.stringify(raidFilterExclude),
        gym_filter_exclude: JSON.stringify(gymFilterExclude),
        pokestop_filter_exclude: JSON.stringify(pokestopFilterExclude),
        invasion_filter_exclude: JSON.stringify(invasionFilterExclude),
        spawnpoint_filter_exclude: JSON.stringify(spawnpointFilterExclude),
        nest_filter_exclude: JSON.stringify(nestFilterExclude),
        weather_filter_exclude: JSON.stringify(weatherFilterExclude),
        device_filter_exclude: JSON.stringify(deviceFilterExclude),
        show_spawnpoints: showSpawnpoints,
        show_nests: showNests,
        show_cells: showCells && map.getZoom() >= 13,
        show_submission_placement_cells: showSubmissionCells && map.getZoom() >= 16,
        show_submission_type_cells: showSubmissionCells && map.getZoom() >= 14,
        show_weather: showWeather,
        show_active_devices: showDevices,
        last_update: lastUpdateServer
    };

    loadRequest = $.ajax({
        url: '/api/get_data',
        data: data,
        type: 'POST',
        async: true,
        success: function (data) {
            const gyms = data.data.gyms;
            let ts = Math.round((new Date()).getTime() / 1000);
            $.each(gyms, function (index, gym) {
                if (showGyms || (showRaids && gym.raid_end_timestamp >= ts)) {
                    if (gym.updated > lastUpdateServer) {
                        lastUpdateServer = gym.updated;
                    }
                    const oldGym = gymMarkers.find(function (value) {
                        return gym.id === value.id;
                    });

                    if (gym.team_id === null) {
                        gym.team_id = 0;
                    }

                    if (oldGym === undefined) {
                        const marker = getGymMarker(gym, ts);
                        gym.marker = marker;
                        gymMarkers.push(gym);
                        if (clusterGyms) {
                            clusters.addLayer(gym.marker);
                        } else {
                            gym.marker.addTo(map);
                        }
                        if (gym.raid_end_timestamp >= ts) {
                            startRaidTimer(gym, ts);
                            gym.raidTimerSet = true;
                            if (showRaidTimers) {
                                setDespawnTimer(gym);
                            }
                        } else {
                            gym.raidTimerSet = false;
                        }
                    } else {
                        oldGym.updated = gym.updated;
                        oldGym.last_modified_timestamp = gym.last_modified_timestamp;

                        if (oldGym.availble_slots !== gym.availble_slots ||
                            oldGym.team_id !== gym.team_id ||
                            oldGym.guarding_pokemon_id !== gym.guarding_pokemon_id ||
                            oldGym.in_battle !== gym.in_battle ||
                            oldGym.total_cp !== gym.total_cp ||
                            oldGym.raid_end_timestamp !== gym.raid_end_timestamp ||
                            oldGym.raid_pokemon_id !== gym.raid_pokemon_id ||
                            oldGym.raid_pokemon_form !== gym.raid_pokemon_form ||
                            oldGym.raid_pokemon_evolution !== gym.raid_pokemon_evolution) {
                            oldGym.availble_slots = gym.availble_slots;
                            oldGym.team_id = gym.team_id;
                            oldGym.guarding_pokemon_id = gym.guarding_pokemon_id;
                            oldGym.in_battle = gym.in_battle;
                            oldGym.total_cp = gym.total_cp;
                            oldGym.raid_end_timestamp = gym.raid_end_timestamp;
                            oldGym.raid_battle_timestamp = gym.raid_battle_timestamp;
                            oldGym.raid_spawn_timestamp = gym.raid_spawn_timestamp;
                            oldGym.raid_pokemon_id = gym.raid_pokemon_id;
                            oldGym.raid_pokemon_form = gym.raid_pokemon_form;
                            oldGym.raid_pokemon_cp = gym.raid_pokemon_cp;
                            oldGym.raid_pokemon_move_1 = gym.raid_pokemon_move_1;
                            oldGym.raid_pokemon_move_2 = gym.raid_pokemon_move_2;
                            oldGym.raid_level = gym.raid_level;
                            oldGym.raid_is_exclusive = gym.raid_is_exclusive;
                            oldGym.raid_pokemon_evolution = gym.raid_pokemon_evolution;
                            oldGym.marker.setIcon(getGymMarkerIcon(oldGym, ts));
                            if (oldGym.raid_end_timestamp >= ts && !oldGym.raidTimerSet) {
                                startRaidTimer(oldGym, ts);
                                oldGym.raidTimerSet = true;
                                if (showRaidTimers) {
                                    setDespawnTimer(oldGym);
                                }
                            }
                        }
                    }
                }
            });

            const pokestops = data.data.pokestops;
            ts = Math.round((new Date()).getTime() / 1000);
            $.each(pokestops, function (index, pokestop) {
                if (showPokestops ||
                    (showQuests && pokestop.quest_type !== null) ||
                    (showInvasions && pokestop.incident_expire_timestamp > ts)
                    ) {
                    if (pokestop.updated > lastUpdateServer) {
                        lastUpdateServer = pokestop.updated;
                    }
                    const oldPokestop = pokestopMarkers.find(function (value) {
                        return pokestop.id === value.id;
                    });

                    if (pokestop.lure_expire_timestamp === null) {
                        pokestop.lure_expire_timestamp = 0;
                    }

                    if (pokestop.incident_expire_timestamp === null) {
                        pokestop.incident_expire_timestamp = 0;
                    }

                    if (oldPokestop === undefined) {
                        pokestop.marker = getPokestopMarker(pokestop, ts);
                        pokestopMarkers.push(pokestop);
                        if (clusterPokestops) {
                            clusters.addLayer(pokestop.marker);
                        } else {
                            pokestop.marker.addTo(map);
                        }
                        if (pokestop.lure_expire_timestamp >= ts) {
                            pokestop.willUpdate = true;
                            startPokestopTimer(pokestop, pokestop.lure_expire_timestamp, ts);
                        } else {
                            pokestop.willUpdate = false;
                        }
                        if (pokestop.incident_expire_timestamp >= ts) {
                            pokestop.willUpdate = true;
                            startPokestopTimer(pokestop, pokestop.incident_expire_timestamp, ts);
                            pokestop.invasionTimerSet = true;
                            if (showInvasionTimers) {
                                setDespawnTimer(pokestop);
                            }
                        } else {
                            pokestop.willUpdate = false;
                            pokestop.invasionTimerSet = false;
                        }
                    } else {
                        if (oldPokestop.lure_expire_timestamp !== pokestop.lure_expire_timestamp) {
                            oldPokestop.lure_expire_timestamp = pokestop.lure_expire_timestamp;
                            oldPokestop.lure_id = pokestop.lure_id;
                            oldPokestop.marker.setIcon(getPokestopMarkerIcon(pokestop, ts));
                        }
                        if (oldPokestop.incident_expire_timestamp !== pokestop.incident_expire_timestamp) {
                            oldPokestop.incident_expire_timestamp = pokestop.incident_expire_timestamp;
                            oldPokestop.pokestop_display = pokestop.pokestop_display;
                            oldPokestop.grunt_type = pokestop.grunt_type;
                            oldPokestop.marker.setIcon(getPokestopMarkerIcon(pokestop, ts));
                        }

                        oldPokestop.updated = pokestop.updated;
                        oldPokestop.last_modified_timestamp = pokestop.last_modified_timestamp;

                        if (oldPokestop.quest_type !== pokestop.quest_type) {
                            oldPokestop.quest_type = pokestop.quest_type;
                            oldPokestop.quest_target = pokestop.quest_target;
                            oldPokestop.quest_template = pokestop.quest_template;
                            oldPokestop.quest_conditions = pokestop.quest_conditions;
                            oldPokestop.quest_rewards = pokestop.quest_rewards;
                            oldPokestop.quest_timestamp = pokestop.quest_timestamp;
                            oldPokestop.marker.setIcon(getPokestopMarkerIcon(pokestop, ts));
                        }
                        if (oldPokestop.willUpdate === false && oldPokestop.lure_expire_timestamp >= ts) {
                            oldPokestop.willUpdate = true;
                            startPokestopTimer(oldPokestop, oldPokestop.lure_expire_timestamp, ts);
                        }
                        if (oldPokestop.willUpdate === false && oldPokestop.incident_expire_timestamp >= ts) {
                            oldPokestop.willUpdate = true;
                            startPokestopTimer(oldPokestop, oldPokestop.incident_expire_timestamp, ts);
                            oldPokestop.invasionTimerSet = true;
                            if (showInvasionTimers) {
                                setDespawnTimer(oldPokestop);
                            }
                        }
                    }
                }
            });

            const pokemon = data.data.pokemon;
            ts = Math.round((new Date()).getTime() / 1000);
            $.each(pokemon, function (index, pokemon) {
                if (showPokemon && pokemon.expire_timestamp >= ts /* && matchesPokemonFilter(pokemon.pokemon_id) */ && !hiddenPokemonIds.includes(pokemon.id)) {
                    if (pokemon.updated > lastUpdateServer) {
                        lastUpdateServer = pokemon.updated;
                    }
                    const oldPokemon = pokemonMarkers.find(function (value) {
                        return pokemon.id === value.id;
                    });

                    if (oldPokemon === undefined) {
                        if (pokemon.pokestop_id !== null && pokemon.spawn_id === null) {
                            let latOffset = Math.random() * 0.0002 - 0.0001;
                            if (latOffset >= 0) {
                                latOffset += 0.00005;
                            } else {
                                latOffset -= 0.00005;
                            }
                            let lonOffset = Math.random() * 0.0002 - 0.0001;
                            if (lonOffset >= 0) {
                                lonOffset += 0.00005;
                            } else {
                                lonOffset -= 0.00005;
                            }
                            pokemon.lat += latOffset;
                            pokemon.lon += +lonOffset;
                        }

                        pokemon.marker = getPokemonMarker(pokemon, ts);
                        pokemonMarkers.push(pokemon);
                        startDespawnTimer(pokemon, ts);
                        if (clusterPokemon) {
                            clusters.addLayer(pokemon.marker);
                        } else {
                            pokemon.marker.addTo(map);
                        }
                        
                    } else {
                        if (oldPokemon.expire_timestamp !== pokemon.expire_timestamp) {
                            oldPokemon.expire_timestamp = pokemon.expire_timestamp;
                        }
                        if (oldPokemon.atk_iv !== pokemon.atk_iv) {
                            oldPokemon.atk_iv = pokemon.atk_iv;
                            oldPokemon.def_iv = pokemon.def_iv;
                            oldPokemon.sta_iv = pokemon.sta_iv;
                            oldPokemon.cp = pokemon.cp;
                            oldPokemon.weight = pokemon.weight;
                            oldPokemon.size = pokemon.size;
                            oldPokemon.move_1 = pokemon.move_1;
                            oldPokemon.move_2 = pokemon.move_2;
                            oldPokemon.level = pokemon.level;
                        }
                        if (oldPokemon.updated !== pokemon.updated) {
                            oldPokemon.updated = pokemon.updated;
                        }

                        if (hiddenPokemonIds.includes(oldPokemon.id)) {
                            map.removeLayer(oldPokemon.marker);
                        }
                    }
                }
            });

            const spawnpoints = data.data.spawnpoints;
            $.each(spawnpoints, function (index, spawnpoint) {
                if (showSpawnpoints) {
                    if (spawnpoint.updated > lastUpdateServer) {
                        lastUpdateServer = spawnpoint.updated;
                    }
                    const oldSpawnpoint = spawnpointMarkers.find(function (value) {
                        return spawnpoint.lat === value.lat && spawnpoint.lon === value.lon;
                    });

                    if (oldSpawnpoint === undefined) {
                        spawnpoint.marker = getSpawnpointMarker(spawnpoint, ts);
                        spawnpointMarkers.push(spawnpoint);
                        spawnpoint.marker.addTo(map);
                    }
                }
            });

            const devices = data.data.active_devices;
            $.each(devices, function (index, device) {
                if (showDevices) {
                    if (device.last_seen > lastUpdateServer) {
                        lastUpdateServer = device.last_seen;
                    }
                    const oldDevice = deviceMarkers.find(function (value) {
                        return device.uuid === value.uuid;
                    });

                    if (oldDevice === undefined) {
                        device.marker = getDeviceMarker(device, ts);
                        deviceMarkers.push(device);
                        device.marker.addTo(map);
                    } else {
                        let isOffline = isDeviceOffline(device, ts);
                        oldDevice.marker.setIcon(isOffline ? deviceOfflineIcon : deviceOnlineIcon);
                        oldDevice.last_lat = device.last_lat;
                        oldDevice.last_lon = device.last_lon;
                        oldDevice.last_seen = device.last_seen;
                    }
                }
            });

            const cells = data.data.cells;
            $.each(cells, function (index, cell) {
                if (showCells && map.getZoom() >= 13) {
                    if (cell.updated > lastUpdateServer) {
                        lastUpdateServer = cell.updated;
                    }
                    const oldCell = cellMarkers.find(function (value) {
                        return cell.id === value.id;
                    });

                    if (oldCell === undefined) {
                        cell.marker = getCellMarker(cell, ts);
                        cellMarkers.push(cell);
                        cell.marker.addTo(map);
                    } else {
                        oldCell.updated = cell.updated;
                        oldCell.marker.setStyle(getCellStyle(cell, ts));
                    }
                }
            });

            const submissionTypeCells = data.data.submission_type_cells;
            $.each(submissionTypeCells, function (index, cell) {
                if (showSubmissionCells && map.getZoom() >= 14) {
                    if (lastUpdateServer === 0) {
                        lastUpdateServer = 1;
                    }

                    const oldCell = submissionTypeCellMarkers.find(function (value) {
                        return cell.id === value.id;
                    });

                    if (oldCell === undefined) {
                        cell.marker = getSubmissionTypeCellMarker(cell, ts);
                        submissionTypeCellMarkers.push(cell);
                        cell.marker.addTo(map);
                    } else {
                        oldCell.updated = cell.updated;
                        oldCell.marker.setStyle(getSubmissionTypeCellStyle(cell, ts));
                    }
                }
            });

            const submissionPlacementCells = data.data.submission_placement_cells;
            $.each(submissionPlacementCells, function (index, cell) {
                if (showSubmissionCells && map.getZoom() >= 16) {
                    if (lastUpdateServer === 0) {
                        lastUpdateServer = 1;
                    }

                    const oldCell = submissionPlacementCellMarkers.find(function (value) {
                        return cell.id === value.id;
                    });

                    if (oldCell === undefined) {
                        cell.marker = getSubmissionPlacementCellMarker(cell, ts);
                        submissionPlacementCellMarkers.push(cell);
                        cell.marker.addTo(map);
                    } else {
                        oldCell.updated = cell.updated;
                        oldCell.marker.setStyle(getSubmissionPlacementCellStyle(cell, ts));
                    }
                }
            });

            const submissionPlacementRings = data.data.submission_placement_rings;
            $.each(submissionPlacementRings, function (index, ring) {
                if (showSubmissionCells && map.getZoom() >= 16) {
                    if (lastUpdateServer === 0) {
                        lastUpdateServer = 1;
                    }
                    const oldRing = submissionPlacementRingMarkers.find(function (value) {
                        return ring.id === value.id;
                    });

                    if (oldRing === undefined) {
                        ring.marker = getSubmissionPlacementRingMarker(ring, ts);
                        submissionPlacementRingMarkers.push(ring);
                        ring.marker.addTo(map);
                    } else {
                        oldRing.updated = ring.updated;
                        oldRing.marker.setStyle(getSubmissionPlacementRingStyle(ring, ts));
                    }
                }
            });

            const weathers = data.data.weather;
            $.each(weathers, function (index, weather) {
                if (showWeather) {
                    if (weather.updated > lastUpdateServer) {
                        lastUpdateServer = weather.updated;
                    }
                    const oldWeather = weatherMarkers.find(function (value) {
                        return weather.id === value.id;
                    });

                    if (oldWeather === undefined) {
                        weather.marker = getWeatherMarker(weather, ts);
                        let weatherIcon;
                        if (weather.gameplay_condition > 0) {
                            weatherIcon = `<img src="/img/weather/${weather.gameplay_condition}.png" height="25" width="25">`;
                        } else {
                            weatherIcon = '';
                        }
                        const weatherName = getWeatherName(weather.gameplay_condition);
                        const options = { permanent: true, className: 'leaflet-tooltip', direction: 'center', offset: [0, 15] };
                        /* let tooltip = */ weather.marker.bindTooltip('<center>' + weatherIcon + '</center><center><b>' + weatherName + '</b></center>', options);
                        weatherMarkers.push(weather);
                        weather.marker.addTo(map);
                    } else {
                        if (oldWeather.gameplay_condition !== weather.gameplay_condition ||
                            oldWeather.rain_level !== weather.raid_level ||
                            oldWeather.cloud_level !== weather.cloud_level ||
                            oldWeather.fog_level !== weather.fog_level ||
                            oldWeather.snow_level !== weather.snow_level ||
                            oldWeather.wind_level !== weather.wind_level ||
                            oldWeather.special_effect_level !== weather.special_effect_level ||
                            oldWeather.severity !== weather.severity ||
                            oldWeather.warn_weather !== warn_weather) {
                            oldWeather.gameplay_condition = weather.gameplay_condition;
                            oldWeather.raid_level = weather.raid_level;
                            oldWeather.cloud_level = weather.cloud_level;
                            oldWeather.fog_level = weather.fog_level;
                            oldWeather.snow_level = weather.snow_level;
                            oldWeather.wind_level = weather.wind_level;
                            oldWeather.special_effect_level = weather.special_effect_level;
                            oldWeather.severity = weather.severity;
                            oldWeather.warn_weather = weather.warn_weather;
                        }
                        oldWeather.updated = weather.updated;
                        oldWeather.marker.setStyle(getWeatherStyle(weather, ts));
                    }
                }
            });

            const nests = data.data.nests;
            $.each(nests, function (index, nest) {
                if (showNests) {
                    const oldNest = nestMarkers.find(function (value) {
                        return nest.nest_id === value.nest_id;
                    });
                    let geojson = getGeoJsonFromId(nest);
                    if (geojson !== undefined) {
                        if (oldNest === undefined) {
                            nest.marker = getNestMarker(nest, geojson, ts);
                            nestMarkers.push(nest);
                            nest.marker.addTo(nestLayer);
                        }
                    }
                }
            });

            lastUpdate = new Date();
            loadRequest = null;
        }
    });
}

function getGeoJsonFromId(nest) {
    const nestId = parseInt(nest.nest_id);
    let geojson = nestsDb.features.find(function (value) {
        return nestId === parseInt(value.id);
    });
    return geojson;
}

function loadScanAreaPolygons () {
    if (scanAreasDb === null) {
        return;
    }
    try {
        var areaGeoPolys = L.geoJson(scanAreasDb, {
            onEachFeature: function(features, featureLayer) {
                let coords = features.geometry.coordinates[0];
                let areaSize = geodesicArea(coords);
                let size = convertAreaToSqkm(areaSize).toFixed(2);
                featureLayer.bindPopup(getScanAreaPopupContent(features.properties.name, size));
            }
        });
        scanAreaLayer.addLayer(areaGeoPolys);
    } catch (err) {
        console.error('Failed to load areas.json file\nError:', err);
    }
}


// MARK: - Filters

function getPokemonSize (pokemonId, pokemonForm) {
    const id = pokemonForm === 0 ? pokemonId : `${pokemonId}-${pokemonForm}`;
    if (pokemonFilter[id] === undefined) {
        // TODO: console.log('Pokemon size undefined:', id, 'form:', pokemonForm);
        return 40;
    }
    const size = pokemonFilter[id].size;
    if (size === 'huge') {
        return 75;
    }
    return 40;
}

function getPokemonIndex (pokemon) {
    const id = pokemon.form === 0 ? pokemon.pokemon_id : `${pokemon.pokemon_id}-${pokemon.form}`;
    if (pokemonFilter[id] === undefined) {
        // TODO: console.log('Pokemon index undefined:', id);
        return 2;
    }
    const size = pokemonFilter[id].size
    if (pokemon.atk_iv === 15 && pokemon.def_iv === 15 && pokemon.sta_iv === 15) {
        return 9;
    }
    if (pokemon.pvp_rankings_great_league !== null && pokemon.pvp_rankings_ultra_league !== null) {
        let bestRank = 4;
        $.each(pokemon.pvp_rankings_great_league, function (index, ranking) {
            if (ranking.rank !== null && ranking.rank < bestRank && ranking.rank <= 100 && ranking.cp >= 1400 && ranking.cp <= 1500) {
                bestRank = ranking.rank;
            }
        });
        $.each(pokemon.pvp_rankings_ultra_league, function (index, ranking) {
            if (ranking.rank !== null && ranking.rank < bestRank && ranking.rank <= 100 && ranking.cp >= 2400 && ranking.cp <= 2500) {
                bestRank = ranking.rank;
            }
        });
        if (bestRank === 1) {
            return 7;
        } else if (bestRank === 2) {
            return 6;
        } else if (bestRank === 3) {
            return 5;
        }
    }
    if (size === 'huge') {
        return 4;
    }
    return 2;
}
  
function hasRelevantLeagueStats (leagueStats, greatLeague) {
    var found = false;
    var minCP = greatLeague !== false ? 1400 : 2400;
    var maxCP = greatLeague !== false ? 1500 : 2500;
    var maxRank = 100;
    if (leagueStats) {
        for (var i = 0; i < leagueStats.length; i++) {
            if (leagueStats[i].rank <= maxRank && leagueStats[i].cp >= minCP && leagueStats[i].cp <= maxCP) {
                found = true;
                break;
            }
        }
    }
    return found;
}  

function getQuestSize (questId) {
    if (questFilter[questId] === undefined || questFilter[questId].size === undefined) {
        return 30;
    }
    const size = questFilter[questId].size;
    if (size === 'huge') {
        return 65;
    }
    return 30;
}

function getQuestIndex (questId) {
    if (questFilter[questId] === undefined || questFilter[questId].size === undefined) {
        return 0;
    }
    const size = questFilter[questId].size;
    if (size === 'huge') {
        return 4;
    }
    return 2;
}

function getGymSize (teamId) {
    const size = gymFilter['t' + teamId].size;
    if (size === 'huge') {
        return 75;
    }
    return 40;
}

function getRaidSize (id) {
    if (raidFilter[id] === undefined) {
        // TODO: Fix raid filter sizing
        //console.log('raidFilter[id] undefined:', id, raidFilter);
        return 40;
    }
    const size = raidFilter[id].size;
    if (size === 'huge') {
        return 75;
    }
    return 40;
}

function getPokestopSize (id) {
    return 30;
    // TODO: Fix or just remove size
    const size = showInvasions ? invasionFilter[id].size : pokestopFilter[id].size;
    if (size === 'huge') {
        return 65;
    }
    return 30;
}


// MARK: - Local Storage

function store (name, value) {
    localStorage.setItem(name, value);
}

function retrieve (name) {
    return localStorage.getItem(name);
}


// MARK: - Timers

function startDespawnTimer (pokemon, ts) {
    setTimeout(
        function () {
            const ts2 = Math.round((new Date()).getTime() / 1000);
            const realPokemon = pokemonMarkers.find(function (value) {
                return pokemon.id === value.id;
            });
            if (realPokemon === undefined) {
                return;
            }
            if (ts2 + 1 >= realPokemon.expire_timestamp) {
                pokemonMarkers = pokemonMarkers.filter(function (obj) {
                    return obj.id !== realPokemon.id;
                });
            } else {
                return startDespawnTimer(realPokemon, ts2);
            }

            if (clusterPokemon) {
                clusters.removeLayer(realPokemon.marker);
            } else {
                map.removeLayer(realPokemon.marker);
            }
        }, (pokemon.expire_timestamp - ts) * 1000);
}

function startRaidTimer (gym, ts) {
    setTimeout(
        function () {
            const ts2 = Math.round((new Date()).getTime() / 1000);
            const realGym = gymMarkers.find(function (value) {
                return gym.id === value.id;
            });
            if (realGym === undefined) {
                return;
            }
            realGym.raidTimerSet = false;

            if (!showGyms) {
                gymMarkers = gymMarkers.filter(function (obj) {
                    return obj.id !== realGym.id;
                });
                if (clusterGyms) {
                    clusters.removeLayer(realGym.marker);
                } else {
                    map.removeLayer(realGym.marker);
                }
            } else {
                realGym.marker.setIcon(getGymMarkerIcon(realGym, ts2 + 1));
            }
        }, (gym.raid_end_timestamp - ts) * 1000);

    setTimeout(
        function () {
            const ts2 = Math.round((new Date()).getTime() / 1000);
            const realGym = gymMarkers.find(function (value) {
                return gym.id === value.id;
            });
            if (realGym === undefined) {
                return;
            }
            realGym.marker.setIcon(getGymMarkerIcon(realGym, ts2 + 1));
        }, (gym.raid_battle_timestamp - ts) * 1000);
}

function startPokestopTimer (pokestop, expireTimestamp, ts) {
    setTimeout(
        function () {
            const ts2 = Math.round((new Date()).getTime() / 1000);
            const realPokestop = pokestopMarkers.find(function (value) {
                return pokestop.id === value.id;
            });
            if (realPokestop === undefined) {
                return;
            }
            if (expireTimestamp - 10 >= ts2) {
                startPokestopTimer(realPokestop, expireTimestamp, ts2);
            } else {
                pokestopMarkers = pokestopMarkers.filter(function (obj) {
                    return obj.id !== realPokestop.id;
                });
                map.removeLayer(realPokestop.marker);
            }
        }, (expireTimestamp - ts) * 1000);
}


// MARK: - Popups

function updateOpenedPopupLoop () {
    if (openedPokemon !== undefined) {
        openedPokemon.marker._popup.setContent(getPokemonPopupContent(openedPokemon));
    }
    if (openedPokestop !== undefined) {
        openedPokestop.marker._popup.setContent(getPokestopPopupContent(openedPokestop));
    }
    if (openedGym !== undefined) {
        openedGym.marker._popup.setContent(getGymPopupContent(openedGym));
    }
    if (openedCell !== undefined) {
        openedCell.marker._popup.setContent(getCellPopupContent(openedCell));
    }
    if (openedSubmissionTypeCell !== undefined) {
        openedSubmissionTypeCell.marker._popup.setContent(getSubmissionTypeCellPopupContent(openedSubmissionTypeCell));
    }
    if (openedWeather !== undefined) {
        openedWeather.marker._popup.setContent(getWeatherPopupContent(openedWeather));
    }
    if (openedNest !== undefined) {
        openedNest.marker._popup.setContent(getNestPopupContent(openedNest));
    }
    if (openedDevice !== undefined) {
        openedDevice.marker._popup.setContent(getDevicePopupContent(openedDevice));
    }
}

function updateCellsLoop () {
    const ts = Math.round((new Date()).getTime() / 1000);
    $.each(cellMarkers, function (index, cell) {
        cell.marker.setStyle(getCellStyle(cell, ts));
    });
    $.each(weatherMarkers, function (index, weather) {
        weather.marker.setStyle(getWeatherStyle(weather, ts));
    });
}

function updateDevicesLoop () {
    $.each(deviceMarkers, function (index, device) {
        const newLatLng = new L.LatLng(device.last_lat, device.last_lon);
        device.marker.setLatLng(newLatLng);
    });
}

function updateMapTimers () {
    const bounds = map.getBounds();
    $.each(gymMarkers, function (index, marker) {
        if (!bounds.contains(marker)) {
            return;
        }
        if (showRaidTimers) {
            setDespawnTimer(marker);
        } else {
            marker.marker.unbindTooltip();
        }
    });
    $.each(pokestopMarkers, function (index, marker) {
        if (!bounds.contains(marker)) {
            return;
        }
        if (showInvasionTimers) {
            setDespawnTimer(marker);
        } else {
            marker.marker.unbindTooltip();
        }
    });
}

function getPokemonPopupContent (pokemon) {
    const despawnDate = new Date(pokemon.expire_timestamp * 1000);
    const hasIV = pokemon.atk_iv !== null;
    let content = '';

    let pokemonName;
    if (pokemon.form !== 0 && pokemon.form !== null) {
        pokemonName = getFormName(pokemon.form) + ' ' + getPokemonName(pokemon.pokemon_id);
    } else {
        pokemonName = getPokemonName(pokemon.pokemon_id);
    }
    if (pokemon.display_pokemon_id > 0) {
        pokemonName += ' (' + getPokemonNameNoId(pokemon.display_pokemon_id) + ')';
    }

    // TODO: add evolution https://github.com/versx/DataParser/issues/9
    const pokemonIcon = getPokemonIcon(pokemon.pokemon_id, pokemon.form, 0, pokemon.gender, pokemon.costume);

    content +=
    '<div class="row">' + // START 1ST ROW
        '<div class="col-12 col-md-8 center-vertical text-nowrap">' +
            '<h6><b>' + pokemonName + ' ' + getGenderIcon(pokemon.gender) + '</b></h6>' +
        '</div>' +
        '<div class="col-6 col-md-4 center-vertical">' +
            '<div style="float:right; margin-right:5px;">';
    if (!(pokemon.display_pokemon_id > 0) && pokemon.weather !== 0 && pokemon.weather !== null) {
        content += `<img src="/img/weather/${pokemon.weather}.png" height="32" width="32">`;
    }
    content +=
            '</div>' +
        '</div>' +
    '</div>' + // END 1ST ROW

    '<div class="row">' + // START 2ND ROW
        '<div class="' + (hasIV ? 'col-6 col-md-4' : 'col text-center') + '">' +
            '<div class="row pokemon-popup-image-holder">' +
                `<img src="${availableIconStyles[selectedIconStyle].path}/${pokemonIcon}.png">` +
            '</div>' + // END POKEMON ROW
            '<div class="row text-nowrap" style="margin-left:auto; margin-right:auto;">';
    const pkmn = masterfile.pokemon[pokemon.pokemon_id];
    if (pkmn !== undefined && pkmn !== null) {
        const types = pkmn.types;
        if (types !== null && types.length > 0) {
            content += '<div class="col">';
            if (types.length === 2) {
                content += `<img src="/img/type/${types[0].toLowerCase()}.png" height="16" width="16">&nbsp;`;
                content += `<img src="/img/type/${types[1].toLowerCase()}.png" height="16" width="16">`;
            } else {
                content += `<img src="/img/type/${types[0].toLowerCase()}.png" height="16" width="16">`;
            }
            content += '</div>';
        }
    }
    content +=
            '</div>' + // END TYPE ROW
        '</div>' + // END COLUMN
        '<div class="col-12 col-md-8 text-nowrap">';
    if (hasIV) {
        const ivPercent = Math.round((pokemon.atk_iv + pokemon.def_iv + pokemon.sta_iv) / 45 * 1000) / 10;
        content += '<b>IV:</b> ' + ivPercent + '% (A' + pokemon.atk_iv + '|D' + pokemon.def_iv + '|S' + pokemon.sta_iv + ')<br>';
    }
    if (pokemon.cp !== null) {
        content += '<b>CP:</b> ' + pokemon.cp + ' (Lvl. ' + pokemon.level + ')<br>';
    }
    if (pokemon.move_1 !== null) {
        content += '<b>Fast:</b> ' + getMoveName(pokemon.move_1) + '<br>';
    }
    if (pokemon.move_2 !== null) {
        content += '<b>Charge:</b> ' + getMoveName(pokemon.move_2) + '<br>';
    }
    if (pokemon.size > 0 && pokemon.weight > 0 && (pokemon.pokemon_id === 19 || pokemon.pokemon_id === 129)) {
        const baseHeight = pokemon.pokemon_id === 19 ? 0.300000011920929 : 0.89999998;
        const baseWeight = pokemon.pokemon_id === 19 ? 3.5 : 10;
        const size = (pokemon.size / baseHeight) + (pokemon.weight / baseWeight);
        content += '<b>Size:</b> ' + getSize(size) + ' | <b>Weight:</b> ' + Math.round(pokemon.weight) + 'kg<br>';
    } else if (pokemon.weight !== null) {
        content += '<b>Weight:</b> ' + Math.round(pokemon.weight) + 'kg<br>';
    }
    if (pokemon.capture_1 !== null && pokemon.capture_2 !== null && pokemon.capture_3 !== null) {
        content += '<b>Catch Chances:</b><br>'
        content += `<img src="/img/item/1.png" height="14" width="14"> ${(pokemon.capture_1 * 100).toFixed(1)}% `
        content += `<img src="/img/item/2.png" height="14" width="14"> ${(pokemon.capture_2 * 100).toFixed(1)}%<br>`
        content += `<img src="/img/item/3.png" height="14" width="14"> ${(pokemon.capture_3 * 100).toFixed(1)}%<br>`
    }
    content +=
        '</div>' +
    '</div>' + // END 2ND ROW
    '<br>' +
    '<div class="row">' + // START 3RD ROW
        '<div class="col text-nowrap">';
    if (pokemon.expire_timestamp_verified) {
        content += '<b>Despawn Time:</b> ';
    } else {
        content += '<b>Despawn Time:</b> ~';
    }
    content += despawnDate.toLocaleTimeString() + ' (' + getTimeUntill(despawnDate) + ')<br>' +
        '</div>' +
        '<div class="col-sm text-nowrap">';
    if (pokemon.first_seen_timestamp !== 0 && pokemon.first_seen_timestamp !== undefined) {
        const firstSeenDate = new Date(pokemon.first_seen_timestamp * 1000);
        content += '<small><b>First Seen:</b> ' + firstSeenDate.toLocaleTimeString() + ' (' + getTimeSince(firstSeenDate) + ')</small><br>';
    }
    content +=
        '</div>' +
        '<div class="col-sm text-nowrap">';
    if (pokemon.updated !== 0 && pokemon.updated !== null) {
        const updatedDate = new Date(pokemon.updated * 1000);
        content += '<small><b>Latest Seen:</b> ' + updatedDate.toLocaleTimeString() + ' (' + getTimeSince(updatedDate) + ')</small><br>';
    }
    if (pokemon.pvp_rankings_great_league !== undefined && pokemon.pvp_rankings_great_league !== null && hasRelevantLeagueStats(pokemon.pvp_rankings_great_league, true)) {
        content +=
            '<br>' +
            '<b>Great League:</b><br>';
        $.each(pokemon.pvp_rankings_great_league, function (index, ranking) {
          // TODO: Make constants/configurable
            if (ranking.cp !== null && ranking.cp >= 1400 && ranking.cp <= 1500 && ranking.rank <= 100) {
                let pokemonName;
                if (ranking.form !== 0) {
                    pokemonName = getFormName(ranking.form) + ' ' + getPokemonName(ranking.pokemon);
                } else {
                    pokemonName = getPokemonName(ranking.pokemon);
                }
                let infoString;
                if (ranking.rank === null) {
                    infoString = 'CP too high';
                } else {
                    infoString = '#' + ranking.rank + ' (' + Math.round(ranking.percentage * 1000) / 10 + '%)';
                }
                if (ranking.cp !== null) {
                    infoString += ' @' + ranking.cp + 'CP (Lvl. ' + (ranking.level) + ')';
                }
                content += '<small><b>' + pokemonName + ':</b> ' + infoString + '</small><br>';
            }
        });
    }
    if (pokemon.pvp_rankings_ultra_league !== undefined && pokemon.pvp_rankings_ultra_league !== null && hasRelevantLeagueStats(pokemon.pvp_rankings_ultra_league, false)) {
        content +=
            '<br>' +
            '<b>Ultra League:</b><br>';
        $.each(pokemon.pvp_rankings_ultra_league, function (index, ranking) {
            // TODO: Make constants/configurable
            if (ranking.cp !== null && ranking.cp >= 2400 && ranking.cp <= 2500 && ranking.rank <= 100) {
                let pokemonName;
                if (ranking.form !== 0) {
                    pokemonName = getFormName(ranking.form) + ' ' + getPokemonName(ranking.pokemon);
                } else {
                    pokemonName = getPokemonName(ranking.pokemon);
                }
                let infoString;
                if (ranking.rank === null) {
                    infoString = 'CP too high';
                } else {
                    infoString = '#' + ranking.rank + ' (' + Math.round(ranking.percentage * 1000) / 10 + '%)';
                }
                if (ranking.cp !== null) {
                    infoString += ' @' + ranking.cp + 'CP (Lvl. ' + (ranking.level) + ')';
                }
                content += '<small><b>' + pokemonName + ':</b> ' + infoString + '</small><br>';
            }
        });
    }
    content +=
        '</div>' +
    '</div>' + // END 3RD ROW
    '<br>' +
    '<div class="text-center">' +
        '<a id="h' + pokemon.id + '" title="Hide Pokemon" href="#" onclick="setIndividualPokemonHidden(\'' + pokemon.id + '\');return false;"><b>[Hide]</b></a>&nbsp;' +
        '<a title="Filter Pokemon" href="#" onclick="addPokemonFilter(' + pokemon.pokemon_id + ', ' + pokemon.form + ', false);return false;"><b>[Exclude]</b></a>' +
        '<br>' +
        '<br>' +
        '<div class="row">' +
            '<div class="col">' +
                '<a href="https://www.google.com/maps/place/' + pokemon.lat + ',' + pokemon.lon + '" title="Open in Google Maps">' +
                    `<img src="/img/navigation/gmaps.png" height="32" width="32">` +
                '</a>' +
            '</div>' +
            '<div class="col">' +
                '<a href="https://maps.apple.com/maps?daddr=' + pokemon.lat + ',' + pokemon.lon + '" title="Open in Apple Maps">' +
                    `<img src="/img/navigation/applemaps.png" height="32" width="32">` +
                '</a>' +
            '</div>' +
            '<div class="col">' +
                '<a href="https://www.waze.com/ul?ll=' + pokemon.lat + ',' + pokemon.lon + '&navigate=yes" title="Open in Waze">' +
                    `<img src="/img/navigation/othermaps.png" height="32" width="32">` +
                '</a>' +
            '</div>' +
        '</div>' +
        // Only show scouting option if enabled
        (
            enableScouting
            ? '<br>' +
            '<div class="row justify-content-center">' +
                '<a href="javascript:void(0);" onclick="sendWebhook(\'' + pokemon.id + '\');" title="Scan with event account">' +
                    '<b>Scan with event account</b>' +
                '</a>' +
            '</div>'
            : ''
        ) +
    '</div>';
    return content;
}

// eslint-disable-next-line no-unused-vars
function setIndividualPokemonHidden (id) {
    if (id > 0 && !hiddenPokemonIds.includes(id)) {
        hiddenPokemonIds.push(id);
        const pokemonMarker = pokemonMarkers.find(function (value) {
            return id === value.id;
        });

        if (pokemonMarker === null) {
            console.log('Failed to find pokemon marker', id);
        } else {
            map.removeLayer(pokemonMarker.marker);
        }
    }
}

// eslint-disable-next-line no-unused-vars
function addPokemonFilter (pokemonId, formId, show) {
    let pokemonString = null;
    let mappedForm = formId;
    if (formId === 0) {
        const defaultForm = (masterfile.pokemon[pokemonId] || {}).default_form_id;
        if (defaultForm) {
            mappedForm = defaultForm;
        } else {
            pokemonString = String(pokemonId);
        }
    }
    pokemonFilter[pokemonString || pokemonId + '-' + mappedForm].show = show;
    store('pokemon_filter', JSON.stringify(pokemonFilter));

    $.each(pokemonMarkers, function (index, pokemon) {
        if (pokemon.pokemon_id === pokemonId && (pokemon.form === formId || pokemon.form === mappedForm)) {
            map.removeLayer(pokemon.marker);
        }
    });
}

function addQuestFilter (pokemonId, itemId, show) {
    if (pokemonId > 0) {
        questFilter['p' + pokemonId].show = show;
    }
    if (itemId > 0) {
        questFilter['i' + itemId].show = show;
    }
    store('quest_filter', JSON.stringify(questFilter));

    $.each(pokestopMarkers, function (index, pokestop) {
        const reward = pokestop.quest_rewards ? pokestop.quest_rewards[0] : {};
        const rewardPokemonId = reward.info.pokemon_id || 0;
        const rewardItemId = reward.info.item_id || 0;
        if (rewardPokemonId === pokemonId && rewardItemId === itemId) {
            map.removeLayer(pokestop.marker);
        }
    });
}

function getPokestopPopupContent (pokestop) {
    const now = new Date();
    const lureExpireDate = new Date(pokestop.lure_expire_timestamp * 1000);
    const invasionExpireDate = new Date(pokestop.incident_expire_timestamp * 1000);
    const isActiveLure = lureExpireDate >= now;

    let content = '<div class="text-center">';
    if (pokestop.name === null || pokestop.name === '') {
        content += '<h6><b>Unknown Pokestop Name</b></h6>';
    } else {
        content += '<h6><b>' + pokestop.name + '</b></h6>';
    }

    if (pokestop.url !== null) {
        let lureClass = isActiveLure && pokestop.lure_id !== 0
            ? (pokestop.lure_id === 501
                ? 'lure-normal'
                : pokestop.lure_id === 502
                    ? 'lure-glacial'
                    : pokestop.lure_id === 503
                        ? 'lure-mossy'
                        : pokestop.lure_id === 504
                            ? 'lure-magnetic'
                            : 'lure-normal')
            : '';
        content += '<img src="' + pokestop.url.replace('http://', 'https://') + '" class="circle-image ' + lureClass + '"/><br><br>';
    }

    content += '</div>' +
    '<div class="container">';

    if (isActiveLure) {
        content += '<b>Lure Type:</b> ' + getLureName(pokestop.lure_id) + '<br>';
        content += '<b>Lure End Time:</b> ' + lureExpireDate.toLocaleTimeString() + ' (' + getTimeUntill(lureExpireDate) + ')<br><br>';
    }

    if (invasionExpireDate >= now) {
        const gruntType = getGruntName(pokestop.grunt_type);
        content += '<b>Team Rocket Invasion</b><br>';
        content += '<b>Grunt Type:</b> ' + gruntType + '<br>';
        content += '<b>End Time:</b> ' + invasionExpireDate.toLocaleTimeString() + ' (' + getTimeUntill(invasionExpireDate) + ')<br><br>';
    }

    if (pokestop.quest_type !== null) {
        const conditions = pokestop.quest_conditions;
        let conditionsString = '';
        if (conditions !== undefined && conditions.length > 0) {
            conditionsString += ' (';
            $.each(conditions, function (index, condition) {
                let formating;
                if (index === 0) {
                    formating = '';
                } else {
                    formating = ', ';
                }

                conditionsString += formating + getQuestCondition(condition);
            });
            conditionsString += ')';
        }

        content += '<b>Quest Condition:</b> ' + getQuestName(pokestop.quest_type, pokestop.quest_target) + conditionsString + '<br>';

        $.each(pokestop.quest_rewards, function (index, reward) {
            content += '<b>Quest Reward:</b> ' + getQuestReward(reward) + '<br>';
        });

        content += '<br>';
    }

    const updatedDate = new Date(pokestop.updated * 1000);
    if (updatedDate) {
        content += '<small><b>Last Updated:</b> ' + updatedDate.toLocaleDateString() + ' ' + updatedDate.toLocaleTimeString() + ' (' + getTimeSince(updatedDate) + ')<br></small>';
    }

    const questReward = pokestop.quest_rewards ? pokestop.quest_rewards[0] : {};
    content +=
        '<br>';
    if (pokestop.quest_type !== null) {
        content += '<center><a title="Filter Quest" href="#" onclick="addQuestFilter(' + ((questReward.info || {}).pokemon_id || 0) + ', ' + ((questReward.info || {}).item_id || 0) + ', false);return false;"><b>[Exclude]</b></a></center>';
    }
    content +=
        '<br>' +
        '<div class="row text-center">' +
            '<br>' +
            '<div class="col">' +
                '<a href="https://www.google.com/maps/place/' + pokestop.lat + ',' + pokestop.lon + '" title="Open in Google Maps">' +
                    `<img src="/img/navigation/gmaps.png" height="32" width="32">` +
                '</a>' +
            '</div>' +
            '<div class="col">' +
                '<a href="https://maps.apple.com/maps?daddr=' + pokestop.lat + ',' + pokestop.lon + '" title="Open in Apple Maps">' +
                    `<img src="/img/navigation/applemaps.png" height="32" width="32">` +
                '</a>' +
            '</div>' +
            '<div class="col">' +
                '<a href="https://www.waze.com/ul?ll=' + pokestop.lat + ',' + pokestop.lon + '&navigate=yes" title="Open in Waze">' +
                    `<img src="/img/navigation/othermaps.png" height="32" width="32">` +
                '</a>' +
            '</div>' +
        '</div>' +
    '</div>';
    return content;
}

function getGymPopupContent (gym) {
    const now = new Date();
    const raidBattleDate = new Date(gym.raid_battle_timestamp * 1000);
    const raidEndDate = new Date(gym.raid_end_timestamp * 1000);

    const isRaid = raidEndDate >= now && parseInt(gym.raid_level) > 0;
    const isRaidBattle = raidBattleDate <= now && isRaid;

    let gymName = '';
    if (gym.name === null || gym.name === '') {
        gymName = 'Unknown Gym Name';
    } else {
        gymName = gym.name;
    }

    let titleSize = 16;//'medium';
    if (gymName.length > 40) {
        //titleSize = 'xx-small';
        titleSize = 8;
    } else if (gymName.length > 30) {
        //titleSize = 'small';
        titleSize = 11;
    } else if (gymName.length > 20) {
        //titleSize = 'small';
        titleSize = 14;
    }

    let content =
    '<div class="row">' + // START 1ST ROW
        '<div class="col-12 col-md-8 center-vertical">' +
            `<span class="text-nowrap" style="font-size:${titleSize}px;"><b>${gymName}</b></span>` +
        '</div>' +
        '<div class="col-6 col-md-4 center-vertical">' +
            '<div style="float:right; margin: auto;">' +
                `<img src="/img/team/${gym.team_id}.png" height="32" width="32">` +
            '</div>' +
        '</div>' +
    '</div>'; // END 1ST ROW

    if (isRaid) {
        let hasRaidBoss = gym.raid_pokemon_id !== 0 && gym.raid_pokemon_id !== null;
        let pokemonName;
        if (hasRaidBoss && isRaidBattle) {
            if (gym.raid_pokemon_form !== 0 && gym.raid_pokemon_form !== null) {
                pokemonName = getFormName(gym.raid_pokemon_form) + ' ' + getPokemonName(gym.raid_pokemon_id);
            } else {
                pokemonName = getPokemonName(gym.raid_pokemon_id);
            }
            pokemonName += ' ' + getGenderIcon(gym.raid_pokemon_gender);
        } else if (isRaidBattle) {
            pokemonName = 'Unknown Raid Boss';
        } else {
            pokemonName = 'Level ' + gym.raid_level + ' Egg';
        }
        const pokemonIcon = getPokemonIcon(gym.raid_pokemon_id, gym.raid_pokemon_form, gym.raid_pokemon_evolution, gym.raid_pokemon_gender, gym.raid_pokemon_costume);
        content +=
        '<div class="row" style="margin:auto;">' + // START 1ST ROW
            '<div class="col-6 col-md-4">' + // START 1ST COL
                '<div class="row pokemon-popup-image-holder">';
        if (hasRaidBoss && isRaidBattle) {
            content += `<img src="${availableIconStyles[selectedIconStyle].path}/${pokemonIcon}.png">`;
        } else {
            content += `<img src="/img/egg/${gym.raid_level}.png">`;
        }
        content +=
                '</div>' + // END POKEMON ROW
                '<div class="row" style="margin:auto;">';
        if (hasRaidBoss && isRaidBattle) {
            const pkmn = masterfile.pokemon[gym.raid_pokemon_id];
            if (pkmn !== undefined && pkmn !== null) {
                const types = pkmn.types;
                if (types !== null && types.length > 0) {
                    content += '<div class="col text-nowrap">';
                    if (types.length === 2) {
                        content += `<img src="/img/type/${types[0].toLowerCase()}.png" height="16" width="16">&nbsp;`;
                        content += `<img src="/img/type/${types[1].toLowerCase()}.png" height="16" width="16">`;
                    } else {
                        content += `<img src="/img/type/${types[0].toLowerCase()}.png" height="16" width="16">`;
                    }
                    content += '</div>';
                }
            }
        }
        content +=
                '</div>' + // END TYPE ROW
            '</div>' + // END 1ST COLUMN
            '<div class="col-12 col-md-8 text-nowrap">' + // START 2ND COL
                '<h7><b>' + pokemonName + '</b></h7><br>';
        if (hasRaidBoss && isRaidBattle) {
            if (gym.raid_pokemon_evolution) {
                content += '<b>Evolution:</b> ' + getEvolutionName(gym.raid_pokemon_evolution) + '<br>';
            }
            if (gym.raid_pokemon_cp !== null) {
                if (gym.raid_is_exclusive) {
                    content += '<b>Level:</b> EX<br>';
                } else if (gym.raid_level === 6) {
                    content += '<b>Level:</b> Mega<br>';
                } else {
                    content += '<b>Level:</b> ' + gym.raid_level + '<br>';
                }
            }
            if (gym.raid_pokemon_move_1 !== null) {
                let move1 = getMoveName(gym.raid_pokemon_move_1);
                if (move1 !== null) {
                    content += '<b>Fast:</b> ' + move1 + '<br>';
                }
            }
            if (gym.raid_pokemon_move_2 !== null) {
                let move2 = getMoveName(gym.raid_pokemon_move_2);
                if (move2 !== null) {
                    content += '<b>Charge:</b> ' + move2 + '<br>';
                }
            }
            if (gym.in_battle) {
                content += '<b>Gym last seen in battle!</b><br>';
            }
            if (gym.raid_pokemon_form !== null && gym.raid_pokemon_form > 0) {
                content += '<b>Form:</b> ' + getFormName(gym.raid_pokemon_form) + '<br>';
            }
        }
        if (gym.ex_raid_eligible) {
            content += `<img src="/img/misc/ex.png" height="24" width="32">`;
        }
        content +=
            '</div>' + // END 2ND COL
        '</div><br>'; // END 2ND ROW
    } else {
        content +=
        '<div class="row">'; // START 3RD ROW
        let hasGymUrl = gym.url !== null;
        if (hasGymUrl) {
            let teamClass = gym.team_id === 0
                ? 'team-neutral'
                : gym.team_id === 1
                    ? 'team-mystic'
                    : gym.team_id === 2
                        ? 'team-valor'
                        : gym.team_id === 3
                            ? 'team-instinct'
                            : '';
            let url = gym.url.replace('http://', 'https://');
            content +=
            '<div class="col-6 col-md-4">' + // START 1ST COL
                // '<a href="' + url + '" target="_blank"><img src="' + url + '" style="border-radius:50%; height:96px; width:96px;"></a>' +
                `<a href="${url}" target="_blank"><img src="${url}" class="circle-image ${teamClass}" style="height:72px; width:72px;"></a>` +
            '</div>'; // END 1ST COL
        }
        content +=
            // '<div class="col-12 col-md-8 ' + (hasGymUrl ? 'text-center' : '') + ' center-vertical">' + //START 2ND COL
            '<div class="col-12 col-md-8 center-vertical p-4">' + // START 2ND COL
                '<b>Team:</b> ' + getTeamName(gym.team_id) + '<br>' +
                '<b>Slots Available:</b> ' + (gym.availble_slots === 0 ? 'Full' : gym.availble_slots === 6 ? 'Empty' : gym.availble_slots) + '<br>';
        if (gym.guarding_pokemon_id !== null) {
            content += '<b>Guard:</b> ' + getPokemonName(gym.guarding_pokemon_id) + '<br>';
        }
        if (gym.total_cp !== null) {
            content += '<b>Total CP:</b> ' + gym.total_cp.toLocaleString() + '<br>';
        }
        if (gym.in_battle) {
            content += '<b>Gym is under attack!</b><br>';
        }
        if (gym.ex_raid_eligible) {
            // content += '<b>Gym is EX-Raid eligible</b>';
            content += `<img src="/img/misc/ex.png" height="24" width="32">`;
        }
        content +=
            '</div>' + // END 2ND COL
        '</div>' + // END 3RD ROW
        '<br>';
    }

    content += '<div class="text-center">';
    if (isRaid && !isRaidBattle) {
        content += '<b>Raid Start:</b> ' + raidBattleDate.toLocaleTimeString() + ' (' + getTimeUntill(raidBattleDate) + ')<br>';
    }
    if (isRaid) {
        content += '<b>Raid End:</b> ' + raidEndDate.toLocaleTimeString() + ' (' + getTimeUntill(raidEndDate) + ')<br>';
        if (gym.raid_pokemon_id > 0) {
            content += `<b>Perfect CP:</b> ${getCpAtLevel(gym.raid_pokemon_id, 20, true)} / Weather: ${getCpAtLevel(gym.raid_pokemon_id, 25, true)}<br>`;
            content += `<b>Worst CP:</b> ${getCpAtLevel(gym.raid_pokemon_id, 20, false)} / Weather: ${getCpAtLevel(gym.raid_pokemon_id, 25, false)}<br><br>`;
        }
    }
    content += '</div>';

    const updatedDate = new Date(gym.updated * 1000);
    const modifiedDate = new Date(gym.last_modified_timestamp * 1000);
    if (updatedDate) {
        content += '<small><b>Last Updated:</b> ' + updatedDate.toLocaleDateString() + ' ' + updatedDate.toLocaleTimeString() + ' (' + getTimeSince(updatedDate) + ')<br></small>';
    }
    if (modifiedDate) {
        content += '<small><b>Last Modified:</b> ' + modifiedDate.toLocaleDateString() + ' ' + modifiedDate.toLocaleTimeString() + ' (' + getTimeSince(modifiedDate) + ')<br></small>';
    }

    content +=
    '<br>' +
    '<div class="row text-center">' +
        '<div class="col">' +
            '<a href="https://www.google.com/maps/place/' + gym.lat + ',' + gym.lon + '" title="Open in Google Maps">' +
                `<img src="/img/navigation/gmaps.png" height="32" width="32">` +
            '</a>' +
        '</div>' +
        '<div class="col">' +
            '<a href="https://maps.apple.com/maps?daddr=' + gym.lat + ',' + gym.lon + '" title="Open in Apple Maps">' +
                `<img src="/img/navigation/applemaps.png" height="32" width="32">` +
            '</a>' +
        '</div>' +
        '<div class="col">' +
            '<a href="https://www.waze.com/ul?ll=' + gym.lat + ',' + gym.lon + '&navigate=yes" title="Open in Waze">' +
                `<img src="/img/navigation/othermaps.png" height="32" width="32">` +
            '</a>' +
        '</div>' +
    '</div>';
    return content;
}

function getCellPopupContent (cell) {
    let content = '<center>';
    content += '<h6><b>Level ' + cell.level + ' S2 Cell</b></h6>';
    content += '<b>Id:</b> ' + cell.id + '<br>';

    const updatedDate = new Date(cell.updated * 1000);

    content += '<b>Last Updated:</b> ' + updatedDate.toLocaleTimeString() + ' (' + getTimeSince(updatedDate) + ')';
    content += '</center>';
    return content;
}

function getSubmissionTypeCellPopupContent (cell) {
    let content = '<center>';
    content += '<h6><b>Level ' + cell.level + ' S2 Cell</b></h6>';
    content += '<b>Id:</b> ' + cell.id + '<br>';
    content += '<b>Total Count:</b> ' + cell.count + '<br>';
    content += '<b>Pokestop Count:</b> ' + cell.count_pokestops + '<br>';
    content += '<b>Gym Count:</b> ' + cell.count_gyms + '<br>';

    const gymThreshold = [2, 6, 20];

    if (cell.count_gyms < 3) {
        content += '<b>Submissions untill Gym:</b> ' + (gymThreshold[cell.count_gyms] - cell.count);
    } else {
        content += '<b>Submissions untill Gym:</b> Never';
    }

    if ((cell.count === 1 && cell.count_gyms < 1) || (cell.count === 5 && cell.count_gyms < 2) || (cell.count === 19 && cell.count_gyms < 3)) {
        content += '<br><b>Next submission will cause a Gym!';
    }

    content += '</center>';
    return content;
}

function degreesToCardinal (d) {
    const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const ix = Math.floor((d + 11.25) / 22.5 - 0.02);
    return dirs[ix % 16];
}

function getWeatherPopupContent (weather) {
    const weatherName = weatherTypes[weather.gameplay_condition].name;
    const weatherType = weatherTypes[weather.gameplay_condition].types;
    let content = `<center>
    <h6><b>${weatherName}</b><br></h6>
    <b>Boosted Types:</b><br>${weatherType}<br>
    <b>Cell ID:</b> ${weather.id}<br>
    <b>Cell Level:</b> ${weather.level}<br>
    <b>Lat:</b> ${weather.latitude.toFixed(5)}<br>
    <b>Lon:</b> ${weather.longitude.toFixed(5)}<br>
    <b>Gameplay Condition:</b> ${getWeatherName(weather.gameplay_condition)}<br>
    <b>Wind Direction:</b> ${weather.wind_direction}° (${degreesToCardinal(weather.wind_direction)})<br>
    <b>Cloud Level:</b> ${weather.cloud_level}<br>
    <b>Rain Level:</b> ${weather.rain_level}<br>
    <b>Wind Level:</b> ${weather.wind_level}<br>
    <b>Snow Level:</b> ${weather.snow_level}<br>
    <b>Fog Level:</b> ${weather.fog_level}<br>
    <b>Special Effects Level:</b> ${weather.special_effect_level}<br>
    <b>Severity:</b> ${weather.severity}<br>
    <b>Weather Warning:</b> ${weather.warn_weather}<br><br>
    `;
    const updatedDate = new Date(weather.updated * 1000);
    content += `<b>Last Updated:</b> ${updatedDate.toLocaleTimeString()} (${getTimeSince(updatedDate)})
    </center>`;
    return content;
}

function getNestPopupContent(nest) {
    const lastUpdated = new Date(nest.updated * 1000);
    const pokemonName = getPokemonName(nest.pokemon_id);
    let content = `
    <center>
        <h6>Park: <b>${nest.name}</b></h6>
        Pokemon: <b>${pokemonName}</b><br>
        Average: <b>${nest.pokemon_avg.toLocaleString()}</b><br>
        Count: <b>${nest.pokemon_count.toLocaleString()}</b><br>
        <br>
        <small>Last Updated: <b>${lastUpdated.toLocaleString()}</b></small><br>
    </center>
    `;
    return content;
}

function getScanAreaPopupContent(name, size) {
    let content = `
    <center>
        <h6>Area: <b>${name}</b></h6>
        Size: ${size} km<sup>2</sup>
    </center>
    `;
    return content;
}


// MARK: - Translation

function getPokemonNameNoId (pokemonId) {
    return i18n('poke_' + pokemonId);
}

function getPokemonName (pokemonId) {
    return i18n('poke_' + pokemonId) + ' (#' + pokemonId + ')';
}

function getThrowType (typeID) {
    return i18n('throw_type_' + typeID);
}

function getPokemonType (typeId) {
    return i18n('poke_type_' + typeId);
}

function getFormName (formId) {
    let form = i18n('form_' + formId);
    return form !== 'Normal' ? form : ''; // TODO: Localize
}

function getMoveName (moveId) {
    return i18n('move_' + moveId);
}

function getWeatherName (weatherId) {
    return i18n('weather_' + weatherId)
}

function getQuestName (questId, amount) {
    return i18n('quest_' + questId, { amount: amount });
}

function getItemName (itemId) {
    return i18n('item_' + itemId);
}

function getLureName (lureId) {
    return i18n('lure_' + lureId);
}

function getGruntName (gruntId) {
    return i18n('grunt_' + gruntId);
}

function getTeamName (teamId) {
    return i18n('filter_gym_team_' + teamId);
}

function getGenderIcon (genderId) {
    return i18n('gender_icon_' + genderId);
}

function getEvolutionName (evolutionId) {
    return i18n('evo_' + evolutionId);
}

//function getWeatherIcon (weatherId) {
//    return i18n('weather_icon_' + weatherId)
//}

function getAlignmentName (alignmentId) {
    return i18n('alignment_' + alignmentId);
}

function getCharacterCategoryName (characterCategoryId) {
    return i18n('character_category_' + characterCategoryId);
}

function getQuestReward (reward) {
    const id = reward.type;
    const info = reward.info;

    if (id === 1 && info !== undefined && info.amount !== undefined) {
        return i18n('quest_reward_1_formatted', { amount: info.amount });
    } else if (id === 2 && info !== undefined && info.amount !== undefined && info.item_id !== undefined) {
        return i18n('quest_reward_2_formatted', { amount: info.amount, item: getItemName(info.item_id) });
    } else if (id === 3 && info !== undefined && info.amount !== undefined) {
        return i18n('quest_reward_3_formatted', { amount: info.amount });
    } else if (id === 4 && info !== undefined && info.amount !== undefined && info.pokemon_id !== undefined) {
        return i18n('quest_reward_4_formatted', { amount: info.amount, pokemon: getPokemonName(info.pokemon_id) });
    } else if (id === 7 && info !== undefined && info.pokemon_id !== undefined) {
        let string;
        if (info.form_id !== 0 && info.form_id !== null) {
            string = getFormName(info.form_id) + ' ' + getPokemonName(info.pokemon_id);
        } else {
            string = getPokemonName(info.pokemon_id);
        }
        if (info.shiny) {
            string += ' (Shiny)';
        }
        return string;
    } else if (id === 12 && info !== undefined && info.amount !== undefined && info.pokemon_id !== undefined) {
        return i18n('quest_reward_12_formatted', { amount: info.amount, pokemon: getPokemonName(info.pokemon_id) });
    } else {
        return i18n('quest_reward_' + id);
    }
}

function getQuestCondition (condition) {
    const id = condition.type;
    const info = condition.info;

    if (id === 1 && info !== undefined && info.pokemon_type_ids !== undefined) {
        let typesString = '';
        $.each(info.pokemon_type_ids, function (index, typeId) {
            let formatted;
            if (index === 0) {
                formatted = '';
            } else if (index === info.pokemon_type_ids.length - 1) {
                formatted = ' or ';
            } else {
                formatted = ', ';
            }
            typesString += formatted + getPokemonType(typeId);
        });
        return i18n('quest_condition_1_formatted', { types: typesString });
    } else if (id === 2 && info !== undefined && info.pokemon_ids !== undefined) {
        let pokemonString = '';
        $.each(info.pokemon_ids, function (index, pokemonId) {
            let formatted;
            if (index === 0) {
                formatted = '';
            } else if (index === info.pokemon_ids.length - 1) {
                formatted = ' or ';
            } else {
                formatted = ', ';
            }
            pokemonString += formatted + getPokemonNameNoId(pokemonId);
        });
        return i18n('quest_condition_2_formatted', { pokemon: pokemonString });
    } else if (id === 7 && info !== undefined && info.raid_levels !== undefined) {
        let levelsString = '';
        $.each(info.raid_levels, function (index, level) {
            let formatted;
            if (index === 0) {
                formatted = '';
            } else if (index === info.raid_levels.length - 1) {
                formatted = ' or ';
            } else {
                formatted = ', ';
            }
            levelsString += formatted + level;
        });
        return i18n('quest_condition_7_formatted', { levels: levelsString });
    } else if (id === 8 && info !== undefined && info.throw_type_id !== undefined) {
        return i18n('quest_condition_8_formatted', { throw_type: getThrowType(info.throw_type_id) });
    } else if (id === 11 && info !== undefined && info.item_id !== undefined) {
        return i18n('quest_condition_11_formatted', { item: getItemName(info.item_id) });
    } else if (id === 14 && info !== undefined && info.throw_type_id !== undefined) {
        return i18n('quest_condition_14_formatted', { throw_type: getThrowType(info.throw_type_id) });
    } else if (id === 26 && info !== undefined && info.alignment_ids !== undefined) {
        let alignmentsString = '';
        $.each(info.alignment_ids, function (index, alignment) {
            let formatted;
            if (index === 0) {
                formatted = '';
            } else if (index === info.alignment_ids.length - 1) {
                formatted = ' or ';
            } else {
                formatted = ', ';
            }
            alignmentsString += formatted + getAlignmentName(alignment);
        });
        return i18n('quest_condition_26_formatted', { alignments: alignmentsString });
    } else if (id === 27 && info !== undefined && info.character_category_ids !== undefined) {
        let categoriesString = '';
        $.each(info.character_category_ids, function (index, characterCategory) {
            let formatted;
            if (index === 0) {
                formatted = '';
            } else if (index === info.character_category_ids.length - 1) {
                formatted = ' or ';
            } else {
                formatted = ', ';
            }
            categoriesString += formatted + getCharacterCategoryName(characterCategory);
        });
        return i18n('quest_condition_27_formatted', { categories: categoriesString });
    } else {
        return i18n('quest_condition_' + id);
    }
}


// MARK: - Markers

function getCellMarker (cell, ts) {
    const polygon = L.polygon(cell.polygon, {
        forceZIndex: 1
    });
    polygon.setStyle(getCellStyle(cell, ts));
    polygon.bindPopup(getCellPopupContent(cell));
    polygon.on('popupopen', function (popup) {
        openedCell = cell;
        polygon._popup.setContent(getCellPopupContent(cell));
    });
    return polygon;
}

function getCellStyle (cell, ts) {
    const ago = ts - cell.updated;
    let value;
    if (ago <= 150) {
        value = 0;
    } else {
        value = Math.min((ago - 150) / 750, 1);
    }
    const hue = ((1 - value) * 120).toString(10);
    return { fillColor: ['hsl(', hue, ',100%,50%)'].join(''), color: 'black', opacity: 0.75, fillOpacity: 0.5, weight: 0.5 };
}

function getSubmissionPlacementCellMarker (cell, ts) {
    const polygon = L.polygon(cell.polygon, { forceZIndex: 2, interactive: false });
    polygon.setStyle(getSubmissionPlacementCellStyle(cell, ts));
    return polygon;
}

function getSubmissionPlacementCellStyle (cell, ts) {
    if (cell.blocked) {
        return { fillColor: 'black', color: 'black', opacity: 0.75, fillOpacity: 0.25, weight: 0.1 };
    } else {
        return { fillColor: 'green', color: 'black', opacity: 0.75, fillOpacity: 0.0, weight: 0.1 };
    }
}

function getSubmissionPlacementRingMarker (ring, ts) {
    const circle = L.circle([ring.lat, ring.lon], {
        radius: ring.radius,
        forceZIndex: 4,
        interactive: false
    });
    circle.setStyle(getSubmissionPlacementRingStyle(ring, ts));
    return circle;
}

function getSubmissionPlacementRingStyle (cell, ts) {
    return { fillColor: 'blue', color: 'black', opacity: 0.75, fillOpacity: 0.25, weight: 0.1 };
}

function getSubmissionTypeCellMarker (cell, ts) {
    const polygon = L.polygon(cell.polygon, { forceZIndex: 3 });
    polygon.setStyle(getSubmissionTypeCellStyle(cell, ts));
    polygon.bindPopup(getSubmissionTypeCellPopupContent(cell));
    polygon.bindTooltip('' + cell.count + '', {
        permanent: true,
        direction: 'center',
        className: 'labelstyle'
    });
    polygon.on('popupopen', function (popup) {
        openedSubmissionTypeCell = cell;
        polygon._popup.setContent(getSubmissionTypeCellPopupContent(cell));
    });
    return polygon;
}

function getSubmissionTypeCellStyle (cell, ts) {
    if ((cell.count === 1 && cell.count_gyms < 1) || (cell.count === 5 && cell.count_gyms < 2) || (cell.count === 19 && cell.count_gyms < 3)) {
        return { fillColor: 'red', color: 'red', opacity: 0.75, fillOpacity: 0.5, weight: 0.75 };
    } else if ((cell.count === 4 && cell.count_gyms < 2) || (cell.count === 18 && cell.count_gyms < 3)) {
        return { fillColor: 'orange', color: 'red', opacity: 0.75, fillOpacity: 0.5, weight: 0.75 };
    } else if (cell.count >= 20) {
        return { fillColor: 'black', color: 'black', opacity: 0.75, fillOpacity: 0.25, weight: 0.75 };
    } else {
        return { fillColor: 'blue', color: 'black', opacity: 0.75, fillOpacity: 0.0, weight: 0.75 };
    }
}

function getWeatherMarker (weather, ts) {
    const polygon = L.polygon(weather.polygon);
    polygon.setStyle(getWeatherStyle(weather, ts));
    polygon.bindPopup(getWeatherPopupContent(weather));
    polygon.on('popupopen', function (popup) {
        openedWeather = weather;
        polygon._popup.setContent(getWeatherPopupContent(weather));
    });
    return polygon;
}

function getNestMarker (nest, geojson, ts) {
    const nestPolygonMarker = L.geoJson(geojson, {
        /*
        pointToLayer: function(feature, latlng) {
            console.log(latlng, feature);
            let icon = L.icon({
                iconUrl: '/img/pokemon/1.png',
                iconSize: [30, 30],
                iconAnchor: [30 / 2, 30 / 2],
                popupAnchor:  [0, 30 * -.6]
            });
            return L.marker(latlng, {icon: icon});
        },
        */
        onEachFeature: function(features, featureLayer) {
            featureLayer.bindPopup(getNestPopupContent(nest));
            featureLayer.setStyle({
                //'weight': 1,
                'stroke': features.properties['stroke'],
                'strokeOpacity': features.properties['stroke-opacity'],
                'strokeWidth': features.properties['stroke-width'],
                'fillColor': features.properties['fill'],
                'fillOpacity': features.properties['fill-opacity']
            });
            const icon = L.divIcon({
                iconSize: [40, 40],
                iconAnchor: [40 / 2, 40 / 2],
                popupAnchor: [0, 40 * -.6],
                className: 'nest-marker',
                html: `<div class="marker-image-holder"><img src="${availableIconStyles[selectedIconStyle].path}/${getPokemonIcon(nest.pokemon_id)}.png"/></div>`
            });
            /*
            const icon = L.icon({
                iconUrl: '/img/pokemon/' + nest.pokemon_id + '.png',
                iconSize: [30, 30],
                iconAnchor: [30 / 2, 30 / 2],
                popupAnchor:  [0, 30 * -.6],
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                shadowSize:  [41, 41]
            });
            */
            L.marker([nest.lat, nest.lon], {icon: icon}).addTo(nestLayer);
        }
    });
    return nestPolygonMarker;
}

function getWeatherStyle (weather, ts) {
    const ago = ts - weather.updated;
    let value;
    if (ago <= 150) {
        value = 0;
    } else {
        value = Math.min((ago - 150) / 1800, 1);
    }
    const hue = ((1 - value) * 120).toString(10);
    return { fillColor: ['hsl(', hue, ',100%,50%)'].join(''), color: 'black', opacity: 0.75, fillOpacity: 0.5, weight: 1.0 };
}

function calcIV(atk, def, sta) {
    return ((atk + def + sta) * 100.0 / 45.0).toFixed(2);
}

function getPokemonMarkerIcon (pokemon, ts) {
    const size = getPokemonSize(pokemon.pokemon_id, pokemon.form);
    const pokemonIdString = getPokemonIcon(pokemon.pokemon_id, pokemon.form, 0, pokemon.gender, pokemon.costume);
    const color = glowColor; // TODO: settings['pokemon-glow'].color;
    const iv = calcIV(pokemon.atk_iv, pokemon.def_iv, pokemon.sta_iv);
    const bestRank = getPokemonBestRank(pokemon.pvp_rankings_great_league, pokemon.pvp_rankings_ultra_league);
    const bestRankIcon = bestRank === 3
        ? 'third'
        : bestRank === 2
            ? 'second'
            : bestRank === 1
                ? 'first'
                : '';
    let iconHtml = bestRank <= 3 && bestRankIcon !== ''
        ? `<img src="/img/misc/${bestRankIcon}.png" style="width:${size / 2}px;height:auto;position:absolute;right:0;bottom:0;" />`
        : '';
    const icon = L.divIcon({
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, size * -.6],
        className: 'pokemon-marker',
        html: `<div class="marker-image-holder"><img src="${availableIconStyles[selectedIconStyle].path}/${pokemonIdString}.png" style="` +
        (
            showPokemonGlow !== false && iv >= glowIV
            ? `filter:drop-shadow(0 0 10px ${color})drop-shadow(0 0 10px ${color});-webkit-filter:drop-shadow(0 0 10px ${color})drop-shadow(0 0 10px ${color});`
            : ''
        ) + `"/></div>${iconHtml}`
    });
    return icon;
}

function getPokemonMarker (pokemon, ts) {
    const marker = L.marker([pokemon.lat, pokemon.lon], {
        icon: getPokemonMarkerIcon(pokemon, ts),
        forceZIndex: 40 + getPokemonIndex(pokemon),
        virtual: true
    });
    marker.bindPopup('');
    marker.on('popupopen', function (popup) {
        openedPokemon = pokemon;
        marker._popup.setContent(getPokemonPopupContent(pokemon));
    });
    /*
    marker.setBouncingOptions({
        bounceHeight: 20, // height of the bouncing
        bounceSpeed: 80, // bouncing speed coefficient
        elastic: false,
        shadowAngle: null
    });
    marker.bounce();
    */
    return marker;
}

function getPokestopMarkerIcon (pokestop, ts) {
    let questSize = 0;
    let iconHtml = '';
    const lureIconId = getLureIconId(pokestop.lure_id);
    const activeLure = showPokestops && lureIconId > 0 && pokestop.lure_expire_timestamp >= ts;
    const activeInvasion = showInvasions && pokestop.incident_expire_timestamp >= ts;
    let sizeId = '0';
    if (activeInvasion && activeLure) {
        sizeId = 'i' + lureIconId;
    } else if (activeInvasion) {
        sizeId = 'i0';
    } else if (activeLure) {
        sizeId = lureIconId;
    }
    const stopSize = getPokestopSize(sizeId);
    const iconAnchorY = stopSize * .896; //availableIconStyles[selectedIconStyle].pokestopAnchorY;
    let popupAnchorY = -8 - iconAnchorY;
    if (showQuests && pokestop.quest_type !== null && pokestop.quest_rewards[0] !== undefined) {
        const id = pokestop.quest_rewards[0].type;
        const info = pokestop.quest_rewards[0].info;
        let rewardString;
        let iconUrl;
        if (id === 1 && info !== undefined && info.amount !== undefined) {
            // XP
            rewardString = 'i-2';
            iconUrl = `/img/item/-2.png`;
        } else if (id === 2) {
            // Item
            const item = info && info.item_id;
            rewardString = 'i' + item;
            //iconUrl = `${availableIconStyles[selectedIconStyle].path}/item/${info.item_id}.png`;
            iconUrl = `/img/item/${item}.png`;
            if (info && info.amount > 1) {
                iconHtml = `<div class="amount-holder"><div>${info.amount}</div></div>`;
            }
        } else if (id === 3) {
            // Stardust
            rewardString = 'i-1';
            //iconUrl = `${availableIconStyles[selectedIconStyle].path}/item/-1.png`;
            iconUrl = '/img/item/-1.png';
            if (info && info.amount > 1) {
                iconHtml = `<div class="amount-holder"><div>${info.amount}</div></div>`;
            }
        } else if (id === 4) {
            // Candy
            rewardString = 'i-3';
            //iconUrl = `${availableIconStyles[selectedIconStyle].path}/item/-3.png`;
            iconUrl = '/img/item/-3.png';
            if (info && info.pokemon_id) {
                iconHtml = `<img src="${availableIconStyles[selectedIconStyle].path}/${getPokemonIcon(info.pokemon_id)}.png"/>`;
            }
            if (info && info.amount > 1) {
                iconHtml += `<div class="amount-holder"><div>${info.amount}</div></div>`;
            }
        } else if (id === 5) {
            // Avatar clothing
            rewardString = 'i-4';
            iconUrl = `/img/item/-4.png`;
        } else if (id === 6) {
            // Quest
            rewardString = 'i-5';
            iconUrl = `/img/item/-5.png`;
        } else if (id === 7 && info !== undefined) {
            // Pokemon
            rewardString = 'p' + info.pokemon_id;
            // TODO: evolution https://github.com/versx/DataParser/issues/10
            iconUrl = `${availableIconStyles[selectedIconStyle].path}/${getPokemonIcon(info.pokemon_id, info.form_id, 0, info.gender_id, info.costume_id, info.shiny)}.png`;
        } else if (id === 8) {
            // Pokecoin
            rewardString = 'i-6';
            iconUrl = `/img/item/-6.png`;
        } else if (id === 11) {
            // Sticker
            rewardString = 'i-7';
            iconUrl = `/img/item/-7.png`;
            if (info && info.amount > 1) {
                iconHtml = `<div class="amount-holder"><div>${info.amount}</div></div>`;
            }
        } else if (id === 12) {
            // Mega resource
            rewardString = 'i-8';
            iconUrl = '/img/item/-8.png';
            if (info && info.pokemon_id) {
                iconHtml = `<img src="${availableIconStyles[selectedIconStyle].path}/${getPokemonIcon(info.pokemon_id)}.png"/>`;
            }
            if (info && info.amount > 1) {
                iconHtml += `<div class="amount-holder"><div>${info.amount}</div></div>`;
            }
        } else {
            rewardString = 'i0';
            iconUrl = `/img/item/-0.png`;
        }
        questSize = getQuestSize(rewardString);
        //const offsetY = stopSize * (availableIconStyles[selectedIconStyle].questOffsetY || 0) - questSize;
        const offsetY = stopSize * 0 - questSize;
        iconHtml = `<div class="marker-image-holder top-overlay" style="width:${questSize}px;height:${questSize}px;left:50%;transform:translateX(-50%);top:${offsetY}px;"><img src="${iconUrl}"/>${iconHtml}</div>`;
        popupAnchorY += offsetY;
    }
    const icon = L.divIcon({
        iconSize: [stopSize, stopSize],
        iconAnchor: [stopSize / 2, iconAnchorY],
        popupAnchor: [0, popupAnchorY],
        className: 'pokestop-marker',
        html: activeInvasion
            ? `<div class="marker-image-holder"><img src="/img/invasion/${sizeId}_${pokestop.grunt_type}.png"/></div>${iconHtml}`
            : `<div class="marker-image-holder"><img src="/img/pokestop/${sizeId}.png"/></div>${iconHtml}`
    });
    return icon;
}

function getPokestopMarker (pokestop, ts) {
    let zIndex;

    if (showQuests && pokestop.quest_type !== null && pokestop.quest_rewards[0] !== undefined) {
        let rewardString;
        const id = pokestop.quest_rewards[0].type;
        const info = pokestop.quest_rewards[0].info;
        if (id === 1 && info !== undefined && info.amount !== undefined) {
            rewardString = 'i-2';
        } else if (id === 2 && info !== undefined && info.amount !== undefined && info.item_id !== undefined) {
            rewardString = 'i' + info.item_id;
        } else if (id === 3 && info !== undefined && info.amount !== undefined) {
            rewardString = 'i-1';
        } else if (id === 4 && info !== undefined && info.amount !== undefined && info.pokemon_id !== undefined) {
            rewardString = 'i-3';
        } else if (id === 7 && info !== undefined && info.pokemon_id !== undefined) {
            rewardString = 'p' + info.pokemon_id;
        } else {
            rewardString = 'i0';
        }
        zIndex = getQuestIndex(rewardString);
    } else {
        zIndex = 0;
    }

    const marker = L.marker([pokestop.lat, pokestop.lon], {
        icon: getPokestopMarkerIcon(pokestop, ts),
        forceZIndex: 20 + zIndex,
        virtual: true
    });
    marker.bindPopup(pokestop.name);
    marker.on('popupopen', function (popup) {
        openedPokestop = pokestop;
        marker._popup.setContent(getPokestopPopupContent(pokestop));
    });
    return marker;
}

function getSpawnpointMarker (spawnpoint, ts) {
    let content = '<center><h6><b>Spawnpoint</b></h6></center>';
    const hasTimer = spawnpoint.despawn_second != null;
    if (hasTimer) {
        const timer = Math.round(spawnpoint.despawn_second / 60);
        content += '<br><b>Despawn Timer:</b> ' + timer + ' minutes';
    }
    const circle = L.circle([spawnpoint.lat, spawnpoint.lon], {
        color: hasTimer ? 'green' : 'red',
        fillColor: hasTimer ? 'green' : 'red',
        fillOpacity: 0.5,
        radius: 1.0
    });
    circle.bindPopup(content);
    return circle;
}

function getGymMarkerIcon (gym, ts) {
    let size;
    if (gym.availble_slots === 6 || gym.team_id === 0) {
        size = 0;
    } else {
        size = (6 - gym.availble_slots);
    }

    // Gym
    let gymSize;
    let iconHtml = '';
    if (gym.in_battle) {
        // Gym Battle
        gymSize = 55; //Set Larger Size For Battle
        iconHtml = `<div class="marker-image-holder"><img src="/img/battle/${gym.team_id}_${size}.png"/></div>`;
    } else {
        // Gym
        gymSize = getGymSize(gym.team_id);
        iconHtml = `<div class="marker-image-holder"><img src="/img/gym/${gym.team_id}_${size}.png"/></div>`;
    }
    const iconAnchorY = gymSize * .849; //availableIconStyles[selectedIconStyle].gymAnchorY;
    let popupAnchorY = -8 - iconAnchorY;

    // Raid overlay
    const raidLevel = gym.raid_level;
    let raidSize = 0;
    let raidIcon;
    if (gym.raid_battle_timestamp <= ts && gym.raid_end_timestamp >= ts && showRaids && parseInt(gym.raid_level) > 0) {
        if (gym.raid_pokemon_id !== 0 && gym.raid_pokemon_id !== null) {
            // Raid Boss
            raidSize = getRaidSize('p' + gym.raid_pokemon_id);
            raidIcon = `${availableIconStyles[selectedIconStyle].path}/${getPokemonIcon(gym.raid_pokemon_id, gym.raid_pokemon_form, gym.raid_pokemon_evolution, gym.raid_pokemon_gender, gym.raid_pokemon_costume)}.png`;
        } else {
            // Egg
            raidSize = getRaidSize('l' + raidLevel);
            raidIcon = `/img/unknown_egg/${raidLevel}.png`;
        }
    } else if (gym.raid_end_timestamp >= ts && parseInt(gym.raid_level) > 0 && showRaids) {
        // Egg
        raidSize = getRaidSize('l' + raidLevel);
        raidIcon = `/img/egg/${raidLevel}.png`;
    }
    if (raidSize > 0) {
        //let offsetY = gymSize * (availableIconStyles[selectedIconStyle].raidOffsetY || .269) - raidSize;
        let offsetY = gymSize * .269 - raidSize;
        iconHtml += `<div class="marker-image-holder top-overlay" style="width:${raidSize}px;height:${raidSize}px;left:50%;transform:translateX(-50%);top:${offsetY}px;"><img src="${raidIcon}"/></div>`;
        popupAnchorY += offsetY;
    }
    const icon = L.divIcon({
        iconSize: [gymSize, gymSize],
        iconAnchor: [gymSize / 2, iconAnchorY],
        popupAnchor: [0, popupAnchorY],
        className: 'gym-marker',
        html: iconHtml
    });
    return icon;
}

function getGymMarker (gym, ts) {
    let zIndex;
    if (showRaids && gym.raid_end_timestamp >= ts) {
        zIndex = gym.raid_level;
    } else {
        zIndex = 0;
    }

    const marker = L.marker([gym.lat, gym.lon], {
        icon: getGymMarkerIcon(gym, ts),
        forceZIndex: 30 + zIndex,
        virtual: true
    });
    marker.bindPopup(gym.name);
    marker.on('popupopen', function (popup) {
        openedGym = gym;
        marker._popup.setContent(getGymPopupContent(gym));
    });

    return marker;
}

function getDeviceMarkerIcon (device, ts) {
    const isOffline = isDeviceOffline(device, ts);
    return isOffline ? deviceOfflineIcon : deviceOnlineIcon;
}

function getDeviceMarker (device, ts) {
    const marker = L.marker([device.last_lat || 1.0, device.last_lon || 1.0], {
        icon: getDeviceMarkerIcon(device, ts),
        forceZIndex: 10,
        virtual: true
    });
    marker.bindPopup('');
    let polyline;
    marker.on('popupopen', function (popup) {
        openedDevice = device;
        marker._popup.setContent(getDevicePopupContent(device));
        const data = JSON.parse(device.data);
        const route = data.area;
        if (device.type === 'circle_pokemon') {
            polyline = L.polyline(route, {color: devicePathColor}).addTo(map);
        } else if (device.type == 'pokemon_iv' || 'auto_quest') {
            polyline = L.polyline(route, {color: devicePathColor, fill: true, fillColor: devicePathColor}).addTo(map);
        }
    });
    marker.on('popupclose', function (popup) {
        if (polyline) {
            map.removeLayer(polyline);
        }
    });
    return marker;
}

function getDevicePopupContent (device) {
    const lastSeenDate = new Date(device.last_seen * 1000);
    const lastSeen = lastSeenDate.toLocaleTimeString() + ' (' + getTimeSince(lastSeenDate) + ')';
    const ts = Math.round((new Date()).getTime() / 1000);
    const isOffline = isDeviceOffline(device, ts);
    const content = '<center><h6><b>' + device.uuid + '</b></h6></center><br>' +
        '<b>Instance:</b> ' + device.instance_name + '<br>' +
        '<b>Last Seen:</b> ' + lastSeen + '<br>' +
        '<b>Status:</b> ' + (isOffline ? 'Offline' : 'Online');
    return content;
}

function isDeviceOffline (device, ts) {
    const delta = 15 * 60;
    const isOffline = device.last_seen > (ts - delta) ? 0 : 1;
    return isOffline;
}

function setDespawnTimer (marker) { // TODO: rename to marker or something more generic
    let date = new Date();
    const ts = date.getTime() / 1000;
    let raidTimestamp = 0;
    if (marker.raid_battle_timestamp <= ts && marker.raid_end_timestamp >= ts && parseInt(marker.raid_level) > 0 && showRaids) {
        // Hatched
        raidTimestamp = marker.raid_end_timestamp;
    } else if (marker.raid_battle_timestamp >= ts && marker.raid_end_timestamp >= ts && parseInt(marker.raid_level) > 0 && showRaids) {
        // Egg
        raidTimestamp = marker.raid_battle_timestamp;
    } else {
        marker.marker.unbindTooltip();
        marker.marker.timerSet = false;
    }

    if (marker.incident_expire_timestamp < ts) {
        marker.marker.timerSet = false;
    }

    if (raidTimestamp > 0) {
        const timer = getTimeUntill(new Date(raidTimestamp * 1000));
        if (marker.marker.timerSet) {
            const text = `<div class='rounded raid-timer'><span class='p-1'>${timer}</span></div>`;
            marker.marker.setTooltipContent(text);
        } else {
            const options = { permanent: true, className: 'leaflet-tooltip', direction: 'bottom', offset: [0, 0] };
            /* let tooltip = */ marker.marker.bindTooltip(timer, options);
            marker.marker.timerSet = true;
        }
    }

    if (marker.incident_expire_timestamp >= ts && showInvasions) {
        const timer = getTimeUntill(new Date(marker.incident_expire_timestamp * 1000));
        if (marker.marker.timerSet) {
            const text = `<div class='rounded invasion-timer'><span class='p-1'>${timer}</span></div>`;
            marker.marker.setTooltipContent(text);
        } else {
            const options = { permanent: true, className: 'leaflet-tooltip invasion-timer span p-0', direction: 'bottom', offset: [0, 0] };
            marker.marker.bindTooltip(timer, options);
            marker.marker.timerSet = true;
        }
    }
}


// MARK: - Misc

function manageSelectButton (e, isNew) {
    const id = e.attr('data-id');
    const type = e.attr('data-type');
    const info = e.attr('data-info');
    let shouldShow = false;
    if (type === 'pokemon' || type === 'pokemon-iv') {
        switch (info) {
        case 'hide':
            shouldShow = pokemonFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = pokemonFilterNew[id].show === true;
            break;
        case 'iv':
            shouldShow = pokemonFilterNew[id].show === 'filter';
            break;
        case 'small':
            shouldShow = pokemonFilterNew[id].size === 'small';
            break;
        case 'normal':
            shouldShow = pokemonFilterNew[id].size === 'normal';
            break;
        case 'large':
            shouldShow = pokemonFilterNew[id].size === 'large';
            break;
        case 'huge':
            shouldShow = pokemonFilterNew[id].size === 'huge';
            break;
        case 'off':
            shouldShow = !pokemonFilterNew['iv_' + id].on;
            break;
        case 'on':
            shouldShow = pokemonFilterNew['iv_' + id].on;
            break;
        }
    } else if (type === 'pokemon-pvp') {
        switch (info) {
        case 'iv':
            shouldShow = pokemonFilterNew[id].show === 'filter';
            break;
        case 'off':
            shouldShow = !pokemonFilterNew['pvp_' + id].on;
            break;
        case 'on':
            shouldShow = pokemonFilterNew['pvp_' + id].on;
            break;
        }
    } else if (type === 'pokemon-size') {
        switch (info) {
        case 'hide':
            shouldShow = pokemonFilterNew[id]['show'] === false;
            break;
        case 'show':
            shouldShow = pokemonFilterNew[id]['show'] === true;
            break;
        case 'small':
            shouldShow = pokemonFilterNew[id]['size'] === "small";
            break;
        case 'normal':
            shouldShow = pokemonFilterNew[id]['size'] === "normal";
            break;
        case 'large':
            shouldShow = pokemonFilterNew[id]['size'] === "large";
            break;
        case 'huge':
            shouldShow = pokemonFilterNew[id]['size'] === "huge";
            break;
        }
    } else if (type === 'pokemon-glow') {
        switch (info) {
        case 'hide':
            shouldShow = settingsNew[id].show === false;
            break;
        case 'show':
            shouldShow = settingsNew[id].show === true;
            break;
        case 'color':
            //shouldShow = settings[id].show === 'color';
            shouldShow = settingsNew[id].show === 'filter';
            break;
        }
    } else if (type === 'pokemon-cluster' || type === 'gym-cluster' || type === 'pokestop-cluster') {
        switch (info) {
        case 'hide':
            shouldShow = settingsNew[id].show === false;
            break;
        case 'show':
            shouldShow = settingsNew[id].show === true;
            break;
        }
    } else if (type === 'quest-misc') {
        switch (info) {
        case 'hide':
            shouldShow = questFilterNew['i' + -id].show === false;
            break;
        case 'show':
            shouldShow = questFilterNew['i' + -id].show === true;
            break;
        case 'small':
            shouldShow = questFilterNew['i' + -id].size === 'small';
            break;
        case 'normal':
            shouldShow = questFilterNew['i' + -id].size === 'normal';
            break;
        case 'large':
            shouldShow = questFilterNew['i' + -id].size === 'large';
            break;
        case 'huge':
            shouldShow = questFilterNew['i' + -id].size === 'huge';
            break;
        }
    } else if (type === 'quest-item') {
        switch (info) {
        case 'hide':
            shouldShow = questFilterNew['i' + id].show === false;
            break;
        case 'show':
            shouldShow = questFilterNew['i' + id].show === true;
            break;
        case 'small':
            shouldShow = questFilterNew['i' + id].size === 'small';
            break;
        case 'normal':
            shouldShow = questFilterNew['i' + id].size === 'normal';
            break;
        case 'large':
            shouldShow = questFilterNew['i' + id].size === 'large';
            break;
        case 'huge':
            shouldShow = questFilterNew['i' + id].size === 'huge';
            break;
        }
    } else if (type === 'quest-pokemon') {
        switch (info) {
        case 'hide':
            shouldShow = questFilterNew['p' + id].show === false;
            break;
        case 'show':
            shouldShow = questFilterNew['p' + id].show === true;
            break;
        case 'small':
            shouldShow = questFilterNew['p' + id].size === 'small';
            break;
        case 'normal':
            shouldShow = questFilterNew['p' + id].size === 'normal';
            break;
        case 'large':
            shouldShow = questFilterNew['p' + id].size === 'large';
            break;
        case 'huge':
            shouldShow = questFilterNew['p' + id].size === 'huge';
            break;
        }
    } else if (type === 'quest-candy-count') {
        switch (info) {
        case 'off':
            shouldShow = !questFilterNew[id].on;
            break;
        case 'on':
            shouldShow = questFilterNew[id].on === true;
            break;
        case 'hide':
            shouldShow = questFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = questFilterNew[id].show === true;
            break;
        }
    } else if (type === 'quest-stardust-count') {
        switch (info) {
        case 'off':
            shouldShow = !questFilterNew[id].on;
            break;
        case 'on':
            shouldShow = questFilterNew[id].on === true;
            break;
        case 'hide':
            shouldShow = questFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = questFilterNew[id].show === true;
            break;
        }
    } else if (type === 'raid-timers') {
        switch (info) {
        case 'hide':
            shouldShow = raidFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = raidFilterNew[id].show === true;
            break;
        case 'small':
            shouldShow = raidFilterNew[id].size === 'small';
            break;
        case 'normal':
            shouldShow = raidFilterNew[id].size === 'normal';
            break;
        case 'large':
            shouldShow = raidFilterNew[id].size === 'large';
            break;
        case 'huge':
            shouldShow = raidFilterNew[id].size === 'huge';
            break;
        }
    } else if (type === 'raid-level') {
        switch (info) {
        case 'hide':
            shouldShow = raidFilterNew['l' + id].show === false;
            break;
        case 'show':
            shouldShow = raidFilterNew['l' + id].show === true;
            break;
        case 'small':
            shouldShow = raidFilterNew['l' + id].size === 'small';
            break;
        case 'normal':
            shouldShow = raidFilterNew['l' + id].size === 'normal';
            break;
        case 'large':
            shouldShow = raidFilterNew['l' + id].size === 'large';
            break;
        case 'huge':
            shouldShow = raidFilterNew['l' + id].size === 'huge';
            break;
        }
    } else if (type === 'raid-pokemon') {
        switch (info) {
        case 'hide':
            shouldShow = raidFilterNew['p' + id].show === false;
            break;
        case 'show':
            shouldShow = raidFilterNew['p' + id].show === true;
            break;
        case 'small':
            shouldShow = raidFilterNew['p' + id].size === 'small';
            break;
        case 'normal':
            shouldShow = raidFilterNew['p' + id].size === 'normal';
            break;
        case 'large':
            shouldShow = raidFilterNew['p' + id].size === 'large';
            break;
        case 'huge':
            shouldShow = raidFilterNew['p' + id].size === 'huge';
            break;
        }
    } else if (type === 'gym-team') {
        switch (info) {
        case 'hide':
            shouldShow = gymFilterNew['t' + id].show === false;
            break;
        case 'show':
            shouldShow = gymFilterNew['t' + id].show === true;
            break;
        case 'small':
            shouldShow = gymFilterNew['t' + id].size === 'small';
            break;
        case 'normal':
            shouldShow = gymFilterNew['t' + id].size === 'normal';
            break;
        case 'large':
            shouldShow = gymFilterNew['t' + id].size === 'large';
            break;
        case 'huge':
            shouldShow = gymFilterNew['t' + id].size === 'huge';
            break;
        }
    } else if (type === 'gym-ex') {
        switch (info) {
        case 'hide':
            shouldShow = gymFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = gymFilterNew[id].show === true;
            break;
        case 'small':
            shouldShow = gymFilterNew[id].size === 'small';
            break;
        case 'normal':
            shouldShow = gymFilterNew[id].size === 'normal';
            break;
        case 'large':
            shouldShow = gymFilterNew[id].size === 'large';
            break;
        case 'huge':
            shouldShow = gymFilterNew[id].size === 'huge';
            break;
        }
    } else if (type === 'gym-battle') {
        switch (info) {
        case 'hide':
            shouldShow = gymFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = gymFilterNew[id].show === true;
            break;
        case 'small':
            shouldShow = gymFilterNew[id].size === 'small';
            break;
        case 'normal':
            shouldShow = gymFilterNew[id].size === 'normal';
            break;
        case 'large':
            shouldShow = gymFilterNew[id].size === 'large';
            break;
        case 'huge':
            shouldShow = gymFilterNew[id].size === 'huge';
            break;
        }
    } else if (type === 'gym-slots') {
        switch (info) {
        case 'hide':
            shouldShow = gymFilterNew['s' + id].show === false;
            break;
        case 'show':
            shouldShow = gymFilterNew['s' + id].show === true;
            break;
        case 'small':
            shouldShow = gymFilterNew['s' + id].size === 'small';
            break;
        case 'normal':
            shouldShow = gymFilterNew['s' + id].size === 'normal';
            break;
        case 'large':
            shouldShow = gymFilterNew['s' + id].size === 'large';
            break;
        case 'huge':
            shouldShow = gymFilterNew['s' + id].size === 'huge';
            break;
        }
    } else if (type === 'pokestop-normal') {
        switch (info) {
        case 'hide':
            shouldShow = pokestopFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = pokestopFilterNew[id].show === true;
            break;
        case 'small':
            shouldShow = pokestopFilterNew[id].size === 'small';
            break;
        case 'normal':
            shouldShow = pokestopFilterNew[id].size === 'normal';
            break;
        case 'large':
            shouldShow = pokestopFilterNew[id].size === 'large';
            break;
        case 'huge':
            shouldShow = pokestopFilterNew[id].size === 'huge';
            break;
        }
    } else if (type === 'pokestop-lure') {
        switch (info) {
        case 'hide':
            shouldShow = pokestopFilterNew['l' + id].show === false;
            break;
        case 'show':
            shouldShow = pokestopFilterNew['l' + id].show === true;
            break;
        case 'small':
            shouldShow = pokestopFilterNew['l' + id].size === 'small';
            break;
        case 'normal':
            shouldShow = pokestopFilterNew['l' + id].size === 'normal';
            break;
        case 'large':
            shouldShow = pokestopFilterNew['l' + id].size === 'large';
            break;
        case 'huge':
            shouldShow = pokestopFilterNew['l' + id].size === 'huge';
            break;
        }
    } else if (type === 'invasion-grunt') {
        switch (info) {
        case 'hide':
            shouldShow = invasionFilterNew['i' + id].show === false;
            break;
        case 'show':
            shouldShow = invasionFilterNew['i' + id].show === true;
            break;
        case 'small':
            shouldShow = invasionFilterNew['i' + id].size === 'small';
            break;
        case 'normal':
            shouldShow = invasionFilterNew['i' + id].size === 'normal';
            break;
        case 'large':
            shouldShow = invasionFilterNew['i' + id].size === 'large';
            break;
        case 'huge':
            shouldShow = invasionFilterNew['i' + id].size === 'huge';
            break;
        }
    } else if (type === 'invasion-timers') {
        switch (info) {
        case 'hide':
            shouldShow = invasionFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = invasionFilterNew[id].show === true;
            break;
        case 'small':
            shouldShow = invasionFilterNew[id].size === 'small';
            break;
        case 'normal':
            shouldShow = invasionFilterNew[id].size === 'normal';
            break;
        case 'large':
            shouldShow = invasionFilterNew[id].size === 'large';
            break;
        case 'huge':
            shouldShow = invasionFilterNew[id].size === 'huge';
            break;
        }
    } else if (type === 'spawnpoint-timer') {
        switch (info) {
        case 'hide':
            shouldShow = spawnpointFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = spawnpointFilterNew[id].show === true;
            break;
        case 'small':
            shouldShow = spawnpointFilterNew[id].size === 'small';
            break;
        case 'normal':
            shouldShow = spawnpointFilterNew[id].size === 'normal';
            break;
        case 'large':
            shouldShow = spawnpointFilterNew[id].size === 'large';
            break;
        case 'huge':
            shouldShow = spawnpointFilterNew[id].size === 'huge';
            break;
        }
    } else if (type === 'nest-pokemon') {
        switch (info) {
        case 'hide':
            shouldShow = nestFilterNew['p' + id].show === false;
            break;
        case 'show':
            shouldShow = nestFilterNew['p' + id].show === true;
            break;
        case 'small':
            shouldShow = nestFilterNew['p' + id].size === 'small';
            break;
        case 'normal':
            shouldShow = nestFilterNew['p' + id].size === 'normal';
            break;
        case 'large':
            shouldShow = nestFilterNew['p' + id].size === 'large';
            break;
        case 'huge':
            shouldShow = nestFilterNew['p' + id].size === 'huge';
            break;
        }
    } else if (type === 'nest-avg') {
        switch (info) {
        case 'off':
            shouldShow = !nestFilterNew[id].on;
            break;
        case 'on':
            shouldShow = nestFilterNew[id].on;
            break;
        case 'hide':
            shouldShow = nestFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = nestFilterNew[id].show === true;
            break;
        }
    } else if (type === 'weather-type') {
        switch (info) {
        case 'hide':
            shouldShow = weatherFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = weatherFilterNew[id].show === true;
            break;
        case 'small':
            shouldShow = weatherFilterNew[id].size === 'small';
            break;
        case 'normal':
            shouldShow = weatherFilterNew[id].size === 'normal';
            break;
        case 'large':
            shouldShow = weatherFilterNew[id].size === 'large';
            break;
        case 'huge':
            shouldShow = weatherFilterNew[id].size === 'huge';
            break;
        }
    } else if (type === 'device-status') {
        switch (info) {
        case 'hide':
            shouldShow = deviceFilterNew[id].show === false;
            break;
        case 'show':
            shouldShow = deviceFilterNew[id].show === true;
            break;
        case 'small':
            shouldShow = deviceFilterNew[id].size === 'small';
            break;
        case 'normal':
            shouldShow = deviceFilterNew[id].size === 'normal';
            break;
        case 'large':
            shouldShow = deviceFilterNew[id].size === 'large';
            break;
        case 'huge':
            shouldShow = deviceFilterNew[id].size === 'huge';
            break;
        }
    } else {
        shouldShow = false;
    }

    if (shouldShow) {
        e.addClass('active');
    } else {
        e.removeClass('active');
    }

    if (isNew) {
        e.removeClass('select-button-new');
        e.addClass('select-button');
        e.on('click', function (e) {
            e.preventDefault();
            if (type === 'pokemon' || type === 'pokemon-iv') {
                switch (info) {
                case 'hide':
                    pokemonFilterNew[id].show = false;
                    break;
                case 'show':
                    pokemonFilterNew[id].show = true;
                    break;
                case 'iv':
                    return manageIVPopup(id, pokemonFilterNew);
                case 'small':
                    pokemonFilterNew[id].size = 'small';
                    break;
                case 'normal':
                    pokemonFilterNew[id].size = 'normal';
                    break;
                case 'large':
                    pokemonFilterNew[id].size = 'large';
                    break;
                case 'huge':
                    pokemonFilterNew[id].size = 'huge';
                    break;
                case 'off':
                    pokemonFilterNew['iv_' + id].on = false;
                    break;
                case 'on':
                    pokemonFilterNew['iv_' + id].on = true;
                    break;
                }
            } else if (type === 'pokemon-pvp') {
                switch (info) {
                case 'iv':
                    return manageIVPopup(id, pokemonFilterNew);
                case 'off':
                    pokemonFilterNew['pvp_' + id].on = false;
                    break;
                case 'on':
                    pokemonFilterNew['pvp_' + id].on = true;
                    break;
                }
            } else if (type === 'pokemon-size') {
                switch (info) {
                case 'hide':
                    pokemonFilterNew[id]['show'] = false;
                    break;
                case 'show':
                    pokemonFilterNew[id]['show'] = true;
                    break;
                case 'small':
                    pokemonFilterNew[id]['size'] = 'small';
                    break;
                case 'normal':
                    pokemonFilterNew[id]['size'] = 'normal';
                    break;
                case 'large':
                    pokemonFilterNew[id]['size'] = 'large';
                    break;
                case 'huge':
                    pokemonFilterNew[id]['size'] = 'huge';
                    break;
                }
            } else if (type === 'pokemon-glow') {
                switch (info) {
                case 'hide':
                    settingsNew[id].show = false;
                    break;
                case 'show':
                    settingsNew[id].show = true;
                    break;
                case 'color':
                    return manageColorPopup(id, settings);
                }
            } else if (type === 'pokemon-cluster' || type === 'gym-cluster' || type === 'pokestop-cluster') {
                switch (info) {
                case 'hide':
                    settingsNew[id].show = false;
                    break;
                case 'show':
                    settingsNew[id].show = true;
                    break;
                }
            } else if (type === 'quest-misc') {
                switch (info) {
                case 'hide':
                    questFilterNew['i' + -id].show = false;
                    break;
                case 'show':
                    questFilterNew['i' + -id].show = true;
                    break;
                case 'small':
                    questFilterNew['i' + -id].size = 'small';
                    break;
                case 'normal':
                    questFilterNew['i' + -id].size = 'normal';
                    break;
                case 'large':
                    questFilterNew['i' + -id].size = 'large';
                    break;
                case 'huge':
                    questFilterNew['i' + -id].size = 'huge';
                    break;
                }
            } else if (type === 'quest-item') {
                switch (info) {
                case 'hide':
                    questFilterNew['i' + id].show = false;
                    break;
                case 'show':
                    questFilterNew['i' + id].show = true;
                    break;
                case 'small':
                    questFilterNew['i' + id].size = 'small';
                    break;
                case 'normal':
                    questFilterNew['i' + id].size = 'normal';
                    break;
                case 'large':
                    questFilterNew['i' + id].size = 'large';
                    break;
                case 'huge':
                    questFilterNew['i' + id].size = 'huge';
                    break;
                }
            } else if (type === 'quest-pokemon') {
                switch (info) {
                case 'hide':
                    questFilterNew['p' + id].show = false;
                    break;
                case 'show':
                    questFilterNew['p' + id].show = true;
                    break;
                case 'small':
                    questFilterNew['p' + id].size = 'small';
                    break;
                case 'normal':
                    questFilterNew['p' + id].size = 'normal';
                    break;
                case 'large':
                    questFilterNew['p' + id].size = 'large';
                    break;
                case 'huge':
                    questFilterNew['p' + id].size = 'huge';
                    break;
                }
            } else if (type === 'quest-candy-count') {
                switch (info) {
                case 'off':
                    questFilterNew[id].on = false;
                    break;
                case 'on':
                    questFilterNew[id].on = true;
                    break;
                case 'hide':
                    questFilterNew[id].show = false;
                    break;
                case 'show':
                    questFilterNew[id].show = true;
                    break;
                }
            } else if (type === 'quest-stardust-count') {
                switch (info) {
                case 'off':
                    questFilterNew[id].on = false;
                    break;
                case 'on':
                    questFilterNew[id].on = true;
                    break;
                case 'hide':
                    questFilterNew[id].show = false;
                    break;
                case 'show':
                    questFilterNew[id].show = true;
                    break;
                }
            } else if (type === 'raid-timers') {
                switch (info) {
                case 'hide':
                    raidFilterNew[id].show = false;
                    break;
                case 'show':
                    raidFilterNew[id].show = true;
                    break;
                case 'small':
                    raidFilterNew[id].size = 'small';
                    break;
                case 'normal':
                    raidFilterNew[id].size = 'normal';
                    break;
                case 'large':
                    raidFilterNew[id].size = 'large';
                    break;
                case 'huge':
                    raidFilterNew[id].size = 'huge';
                    break;
                }
            } else if (type === 'raid-level') {
                switch (info) {
                case 'hide':
                    raidFilterNew['l' + id].show = false;
                    break;
                case 'show':
                    raidFilterNew['l' + id].show = true;
                    break;
                case 'small':
                    raidFilterNew['l' + id].size = 'small';
                    break;
                case 'normal':
                    raidFilterNew['l' + id].size = 'normal';
                    break;
                case 'large':
                    raidFilterNew['l' + id].size = 'large';
                    break;
                case 'huge':
                    raidFilterNew['l' + id].size = 'huge';
                    break;
                }
            } else if (type === 'raid-pokemon') {
                switch (info) {
                case 'hide':
                    raidFilterNew['p' + id].show = false;
                    break;
                case 'show':
                    raidFilterNew['p' + id].show = true;
                    break;
                case 'small':
                    raidFilterNew['p' + id].size = 'small';
                    break;
                case 'normal':
                    raidFilterNew['p' + id].size = 'normal';
                    break;
                case 'large':
                    raidFilterNew['p' + id].size = 'large';
                    break;
                case 'huge':
                    raidFilterNew['p' + id].size = 'huge';
                    break;
                }
            } else if (type === 'gym-team') {
                switch (info) {
                case 'hide':
                    gymFilterNew['t' + id].show = false;
                    break;
                case 'show':
                    gymFilterNew['t' + id].show = true;
                    break;
                case 'small':
                    gymFilterNew['t' + id].size = 'small';
                    break;
                case 'normal':
                    gymFilterNew['t' + id].size = 'normal';
                    break;
                case 'large':
                    gymFilterNew['t' + id].size = 'large';
                    break;
                case 'huge':
                    gymFilterNew['t' + id].size = 'huge';
                    break;
                }
            } else if (type === 'gym-ex') {
                switch (info) {
                case 'hide':
                    gymFilterNew[id].show = false;
                    break;
                case 'show':
                    gymFilterNew[id].show = true;
                    break;
                case 'small':
                    gymFilterNew[id].size = 'small';
                    break;
                case 'normal':
                    gymFilterNew[id].size = 'normal';
                    break;
                case 'large':
                    gymFilterNew[id].size = 'large';
                    break;
                case 'huge':
                    gymFilterNew[id].size = 'huge';
                    break;
                }
            } else if (type === 'gym-battle') {
                switch (info) {
                case 'hide':
                    gymFilterNew[id].show = false;
                    break;
                case 'show':
                    gymFilterNew[id].show = true;
                    break;
                case 'small':
                    gymFilterNew[id].size = 'small';
                    break;
                case 'normal':
                    gymFilterNew[id].size = 'normal';
                    break;
                case 'large':
                    gymFilterNew[id].size = 'large';
                    break;
                case 'huge':
                    gymFilterNew[id].size = 'huge';
                    break;
                }
            } else if (type === 'gym-slots') {
                switch (info) {
                case 'hide':
                    gymFilterNew['s' + id].show = false;
                    break;
                case 'show':
                    gymFilterNew['s' + id].show = true;
                    break;
                case 'small':
                    gymFilterNew['s' + id].size = 'small';
                    break;
                case 'normal':
                    gymFilterNew['s' + id].size = 'normal';
                    break;
                case 'large':
                    gymFilterNew['s' + id].size = 'large';
                    break;
                case 'huge':
                    gymFilterNew['s' + id].size = 'huge';
                    break;
                }
            } else if (type === 'pokestop-normal') {
                switch (info) {
                case 'hide':
                    pokestopFilterNew[id].show = false;
                    break;
                case 'show':
                    pokestopFilterNew[id].show = true;
                    break;
                case 'small':
                    pokestopFilterNew[id].size = 'small';
                    break;
                case 'normal':
                    pokestopFilterNew[id].size = 'normal';
                    break;
                case 'large':
                    pokestopFilterNew[id].size = 'large';
                    break;
                case 'huge':
                    pokestopFilterNew[id].size = 'huge';
                    break;
                }
            } else if (type === 'pokestop-lure') {
                switch (info) {
                case 'hide':
                    pokestopFilterNew['l' + id].show = false;
                    break;
                case 'show':
                    pokestopFilterNew['l' + id].show = true;
                    break;
                case 'small':
                    pokestopFilterNew['l' + id].size = 'small';
                    break;
                case 'normal':
                    pokestopFilterNew['l' + id].size = 'normal';
                    break;
                case 'large':
                    pokestopFilterNew['l' + id].size = 'large';
                    break;
                case 'huge':
                    pokestopFilterNew['l' + id].size = 'huge';
                    break;
                }
            } else if (type === 'invasion-grunt') {
                switch (info) {
                case 'hide':
                    invasionFilterNew['i' + id].show = false;
                    break;
                case 'show':
                    invasionFilterNew['i' + id].show = true;
                    break;
                case 'small':
                    invasionFilterNew['i' + id].size = 'small';
                    break;
                case 'normal':
                    invasionFilterNew['i' + id].size = 'normal';
                    break;
                case 'large':
                    invasionFilterNew['i' + id].size = 'large';
                    break;
                case 'huge':
                    invasionFilterNew['i' + id].size = 'huge';
                    break;
                }
            } else if (type === 'invasion-timers') {
                switch (info) {
                case 'hide':
                    invasionFilterNew[id].show = false;
                    break;
                case 'show':
                    invasionFilterNew[id].show = true;
                    break;
                case 'small':
                    invasionFilterNew[id].size = 'small';
                    break;
                case 'normal':
                    invasionFilterNew[id].size = 'normal';
                    break;
                case 'large':
                    invasionFilterNew[id].size = 'large';
                    break;
                case 'huge':
                    invasionFilterNew[id].size = 'huge';
                    break;
                }
            } else if (type === 'spawnpoint-timer') {
                switch (info) {
                case 'hide':
                    spawnpointFilterNew[id].show = false;
                    break;
                case 'show':
                    spawnpointFilterNew[id].show = true;
                    break;
                case 'small':
                    spawnpointFilterNew[id].size = 'small';
                    break;
                case 'normal':
                    spawnpointFilterNew[id].size = 'normal';
                    break;
                case 'large':
                    spawnpointFilterNew[id].size = 'large';
                    break;
                case 'huge':
                    spawnpointFilterNew[id].size = 'huge';
                    break;
                }
            } else if (type === 'nest-pokemon') {
                switch (info) {
                case 'hide':
                    nestFilterNew['p' + id].show = false;
                    break;
                case 'show':
                    nestFilterNew['p' + id].show = true;
                    break;
                case 'small':
                    nestFilterNew['p' + id].size = 'small';
                    break;
                case 'normal':
                    nestFilterNew['p' + id].size = 'normal';
                    break;
                case 'large':
                    nestFilterNew['p' + id].size = 'large';
                    break;
                case 'huge':
                    nestFilterNew['p' + id].size = 'huge';
                    break;
                }
            } else if (type === 'nest-avg') {
                switch (info) {
                case 'off':
                    nestFilterNew[id].on = false;
                    break;
                case 'on':
                    nestFilterNew[id].on = true;
                    break;
                case 'hide':
                    nestFilterNew[id].show = false;
                    break;
                case 'show':
                    nestFilterNew[id].show = true;
                    break;
                }
            } else if (type === 'weather-type') {
                switch (info) {
                case 'hide':
                    weatherFilterNew[id].show = false;
                    break;
                case 'show':
                    weatherFilterNew[id].show = true;
                    break;
                case 'small':
                    weatherFilterNew[id].size = 'small';
                    break;
                case 'normal':
                    weatherFilterNew[id].size = 'normal';
                    break;
                case 'large':
                    weatherFilterNew[id].size = 'large';
                    break;
                case 'huge':
                    weatherFilterNew[id].size = 'huge';
                    break;
                }
            } else if (type === 'device-status') {
                switch (info) {
                case 'hide':
                    deviceFilterNew[id].show = false;
                    break;
                case 'show':
                    deviceFilterNew[id].show = true;
                    break;
                case 'small':
                    deviceFilterNew[id].size = 'small';
                    break;
                case 'normal':
                    deviceFilterNew[id].size = 'normal';
                    break;
                case 'large':
                    deviceFilterNew[id].size = 'large';
                    break;
                case 'huge':
                    deviceFilterNew[id].size = 'huge';
                    break;
                }
            }
        });
    }
}

function manageConfigureButton (e, isNew) {
    const id = e.attr('data-id');
    const type = e.attr('data-type');
    const info = e.attr('data-info');

    if (isNew) {
        e.removeClass('configure-button-new');
        e.addClass('configure-button');
        e.on('click', function (e) {
            e.preventDefault();
            if (type === 'pokemon-iv' || type === 'pokemon-pvp' || type === 'nest-avg' || type === 'quest-candy-count' || type === 'quest-stardust-count') {
                switch (info) {
                case 'global-iv':
                    return manageGlobalIVPopup(id, pokemonFilterNew);
                case 'global-pvp':
                    return manageGlobalPVPPopup(id, pokemonFilterNew);
                case 'global-avg':
                    return manageGlobalAveragePopup(id, nestFilterNew);
                case 'global-candy-count':
                    return manageGlobalCandyCountPopup(id, questFilterNew);
                case 'global-stardust-count':
                    return manageGlobalStardustCountPopup(id, questFilterNew);
                }
            }
        });
    }
}

function getTimeUntill (date) {
    const diff = Math.round((date - new Date()) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor(diff % 3600 / 60);
    const s = Math.floor(diff % 3600 % 60);
    let str = '';
    if (h > 0) {
        str = h + 'h ' + m + 'm ' + s + 's';
    } else if (m > 0) {
        str = m + 'm ' + s + 's';
    } else {
        str = s + 's';
    }

    return str;
}

function getTimeSince (date) {
    const diff = Math.round((new Date() - date) / 1000);
    const h = Math.floor(diff / 3600);
    const m = Math.floor(diff % 3600 / 60);
    const s = Math.floor(diff % 3600 % 60);
    let str = '';
    if (h > 0) {
        str = h + 'h ' + m + 'm ' + s + 's';
    } else if (m > 0) {
        str = m + 'm ' + s + 's';
    } else {
        str = s + 's';
    }

    return str;
}

function manageIVPopup (id, filter) {
    const result = prompt('Please enter an IV Filter. Example: (S0-1 & A15 & D15 & L0-20) | L35 | 90-100', filter[id].filter).toUpperCase();
    const prevShow = filter[id].show;
    let success;
    if (result == null) {
        success = false;
    } else if (checkIVFilterValid(result)) {
        filter[id].show = 'filter';
        filter[id].filter = result;
        success = true;
    } else {
        success = false;
        alert('Invalid IV Filter!');
    }
    if (!success) {
        if (prevShow === true) {
            $('.select-button[data-id="' + id + '"][data-info="show"]').addClass('active');
        } else if (prevShow === false) {
            $('.select-button[data-id="' + id + '"][data-info="hide"]').addClass('active');
        }
    }
    return success;
}

function manageColorPopup (id, filter) {
    const result = (prompt('Please enter a color value. (i.e. red, blue, green, etc)', filter[id].color) || 'red').toUpperCase();
    const prevShow = filter[id].show;
    let success;
    const validColors = ['red','green','blue','yellow','orange','purple'];
    if (result == null) {
        success = false;
    } else if (validColors.includes(result.toLowerCase())) {
        //filter[id].show = 'color';
        //filter[id].filter = result;
        filter[id].color = result.toLowerCase();
        filter[id].filter = result.toLowerCase();
        console.log('Filter:', filter);
        success = true;
    } else {
        success = false;
        alert('Invalid color value!');
    }
    if (!success) {
        if (prevShow === true) {
            $('.select-button[data-id="' + id + '"][data-info="show"]').addClass('active');
        } else if (prevShow === false) {
            $('.select-button[data-id="' + id + '"][data-info="hide"]').addClass('active');
        }
    }
    return success;
}

function manageGlobalIVPopup (id, filter) {
    const result = prompt('Please enter an IV Filter. Example: (S0-1 & A15 & D15 & L0-20) | L35 | 90-100', filter['iv_' + id].filter);
    if (result === null) {
        return false;
    } else if (checkIVFilterValid(result)) {
        filter['iv_' + id].filter = result;
        return true;
    } else {
        alert('Invalid IV Filter!');
        return false;
    }
}

function manageGlobalPVPPopup (id, filter) {
    const result = prompt('Please enter a PVP Filter. Example: 1-5', filter['pvp_' + id].filter);
    if (result === null) {
        return false;
    } else if (checkIVFilterValid(result)) {
        filter['pvp_' + id].filter = result;
        return true;
    } else {
        alert('Invalid PVP Filter!');
        return false;
    }
}

function manageGlobalAveragePopup (id, filter) {
    const result = prompt('Please enter a nest count average to filter. Example: 5', filter[id].filter);
    if (result === null) {
        return false;
    } else if (checkIVFilterValid(result)) {
        filter[id].filter = result;
        return true;
    } else {
        alert('Invalid Nest Filter!');
        return false;
    }
}

function manageGlobalCandyCountPopup (id, filter) {
    const result = prompt('Please enter a candy count to filter. Example: 2', filter[id].filter);
    if (result === null) {
        return false;
    } else if (checkIVFilterValid(result)) {
        filter[id].filter = result;
        return true;
    } else {
        alert('Invalid Quest Filter!');
        return false;
    }
}

function manageGlobalStardustCountPopup (id, filter) {
    const result = prompt('Please enter a stardust amount to filter. Example: 0, 200, 500, 1000, 1500, etc', filter[id].filter);
    if (result === null) {
        return false;
    } else if (checkIVFilterValid(result)) {
        filter[id].filter = result;
        return true;
    } else {
        alert('Invalid Quest Filter!');
        return false;
    }
}

function checkIVFilterValid (filter) {
    let tokenizer = /\s*([()|&]|([ADSL]?)([0-9]+(?:\.[0-9]*)?)(?:-([0-9]+(?:\.[0-9]*)?))?)/g;
    let expectClause = true;
    let stack = 0;
    let lastIndex = 0;
    let match;
    while ((match = tokenizer.exec(filter)) !== null) {
        if (match.index > lastIndex) {
            return null;
        }
        if (expectClause) {
            if (match[3] !== undefined) {
                expectClause = false;
            } else if (match[1] === '(') {
                if (++stack > 1000000000) {
                    return null;
                }
            } else {
                return null;
            }
        } else if (match[3] !== undefined) {
            return null;
        } else switch (match[1]) {
            case '(': return null;
            case ')':
                if (--stack < 0) {
                    return null;
                }
                break;
            case '&':
            case '|':
                expectClause = true;
                break;
        }
        lastIndex = tokenizer.lastIndex;
    }
    if (expectClause || stack !== 0 || lastIndex < filter.length) {
        return null;
    }
    return true;
}

function getLureIconId (lureId) {
    // return lureId - 500;
    switch (lureId) {
    // case 501:
    //    return 1;
    case 502:
        return 2;
    case 503:
        return 3;
    case 504:
        return 4;
    }
    return 1;
}

function getSize (size) {
    if (size < 1.5) return 'Tiny';
    if (size <= 1.75) return 'Small';
    if (size < 2.25) return 'Normal';
    if (size <= 2.5) return 'Large';
    return 'Big';
}

function getPokemonIcon(pokemonId, form = 0, evolution = 0, gender = 0, costume = 0, shiny = false) {
    const evolutionSuffixes = evolution ? ['-e' + evolution, ''] : [''];
    const formSuffixes = form ? ['-f' + form, ''] : [''];
    const costumeSuffixes = costume ? ['-c' + costume, ''] : [''];
    const genderSuffixes = gender ? ['-g' + gender, ''] : [''];
    const shinySuffixes = shiny ? ['-shiny', ''] : [''];
    for (const evolutionSuffix of evolutionSuffixes) {
    for (const formSuffix of formSuffixes) {
    for (const costumeSuffix of costumeSuffixes) {
    for (const genderSuffix of genderSuffixes) {
    for (const shinySuffix of shinySuffixes) {
        const result = `${pokemonId}${evolutionSuffix}${formSuffix}${costumeSuffix}${genderSuffix}${shinySuffix}`;
        if (availableForms.has(result)) return result;
    }
    }
    }
    }
    }
    return '0'; // substitute
}

function getPokemonBestRank(greatLeague, ultraLeague) {
    if ((greatLeague !== null ) || (ultraLeague !== null )) {
        let bestRank = 4;
        $.each(greatLeague, function (index, ranking) {
            if (ranking.rank !== null && ranking.rank < bestRank && ranking.cp >= 1400 && ranking.cp <= 1500) {
                bestRank = ranking.rank;
            }
        });
        $.each(ultraLeague, function (index, ranking) {
            if (ranking.rank !== null && ranking.rank < bestRank && ranking.cp >= 2400 && ranking.cp <= 2500) {
                bestRank = ranking.rank;
            }
        });
        if (bestRank <= 3) {
            return bestRank;
        }
    }
    return 4096;
}

function isQuickStartPokemon(pokemonId) {
    return pokemonRarity.quickStart.pokemon.includes(pokemonId);
}

function isCommonPokemon(pokemonId) {
    return pokemonRarity.common.includes(pokemonId);
}

function isUncommonPokemon(pokemonId) {
    return pokemonRarity.uncommon.includes(pokemonId);
}

function isRarePokemon(pokemonId) {
    return pokemonRarity.rare.includes(pokemonId);
}

function isUltraRarePokemon(pokemonId) {
    return pokemonRarity.ultraRare.includes(pokemonId);
}

function isLegendaryPokemon(pokemonId) {
    return masterfile.pokemon[pokemonId].legendary;
}

function isMythicalPokemon(pokemonId) {
    return masterfile.pokemon[pokemonId].mythic;
}

function isRegionalPokemon(pokemonId) {
    return pokemonRarity.regional.includes(pokemonId);
}

function isEventPokemon(pokemonId) {
    return pokemonRarity.event.includes(pokemonId);
}

function isKantoPokemon(pokemonId) {
    return pokemonGenerationDb.kanto.includes(pokemonId);
}

function isJohtoPokemon(pokemonId) {
    return pokemonGenerationDb.johto.includes(pokemonId);
}

function isHoennPokemon(pokemonId) {
    return pokemonGenerationDb.hoenn.includes(pokemonId);
}

function isSinnohPokemon(pokemonId) {
    return pokemonGenerationDb.sinnoh.includes(pokemonId);
}

function isUnovaPokemon(pokemonId) {
    return pokemonGenerationDb.unova.includes(pokemonId);
}

function isAlolanPokemon(pokemonId, formId) {
    if (masterfile.pokemon[pokemonId]) {
        const pkmn = masterfile.pokemon[pokemonId];
        if (pkmn.forms && pkmn.forms[formId]) {
            const form = pkmn.forms[formId];
            if (form.name === 'Alola') {
                return true;
            }
        }
    }
    return false;
}

function isGalarianPokemon(pokemonId, formId) {
    if (masterfile.pokemon[pokemonId]) {
        const pkmn = masterfile.pokemon[pokemonId];
        if (pkmn.forms && pkmn.forms[formId]) {
            const form = pkmn.forms[formId];
            if (form.name === 'Galarian' || 'Galarian standard' || 'Galarian zen') {
                return true;
            }
        }
    }
}

function sendWebhook(encounterId) {
    // Limit scouts per user
    let scoutCount = 0;
    const scoutCountValue = parseInt(retrieve('scout_count') || 0);
    if (scoutCountValue === null) {
        scoutCount = 1;
    } else {
        scoutCount = scoutCountValue;
        scoutCount++;
    }
    if (scoutCount >= scoutMaxCount) {
        // Max scouts reached for user
        //console.log('Max scouts reached');
        return;
    }
    store('scout_count', scoutCount);

    const pokemonMarker = pokemonMarkers.find(function (value) {
        return encounterId === value.id;
    });
    if (pokemonMarker === null) {
        console.error('Failed to get Pokemon marker to send scouting webhook, might have already despawned.');
        return;
    }
    const { marker, ...pokemonWithoutMarker } = pokemonMarker;
    const data = { type: "pokemon", message: pokemonWithoutMarker };
    data.message.encounter_id = data.message.id;
    data.message.latitude = data.message.lat;
    data.message.longitude = data.message.lon;
    data.message.individual_attack = data.message.atk_iv;
    data.message.individual_defense = data.message.def_iv;
    data.message.individual_stamina = data.message.sta_iv;
    data.message.spawnpoint_id = data.message.spawn_id;
    $.ajax({
        url: scoutingUrl,
        type: 'POST',
        data: data,
        async: true,
        success: function(data) {
            console.log('Scouting task created for encounter', encounterId);
        },
        failure: function(err) {
            if (err) {
                console.error('Scouting failed:', err);
            }
        }
    });
}

function zeroPad(num, places) {
    return String(num).padStart(places, '0');
}

function geodesicArea(latLngs) {
    let pointsCount = latLngs.length;
    let area = 0.0;
    let d2r = Math.PI / 180;
    let p1, p2;
    if (pointsCount > 2) {
        for (let i = 0; i < pointsCount; i++) {
            p1 = latLngs[i];
            p2 = latLngs[(i + 1) % pointsCount];
            area += ((p2[0] - p1[0]) * d2r) *
                (2 + Math.sin(p1[1] * d2r) + Math.sin(p2[1] * d2r));
        }
        area = area * 6378137.0 * 6378137.0 / 2.0;
    }
  
    return Math.abs(area);
}

function convertAreaToSqkm(value) {
    return value * 1.0E-6;
}

function getCpAtLevel(id, level, isMax) {
    if (!masterfile.pokemon[id]) {
        return 0;
    }
    if (cpMultipliers[level]) {
        let pkmn = masterfile.pokemon[id];
        let multiplier = cpMultipliers[level];
        let increment = isMax ? 15 : 10;
        let minAtk = ((pkmn.attack + increment) * multiplier) || 0;
        let minDef = ((pkmn.defense + increment) * multiplier) || 0;
        let minSta = ((pkmn.stamina + increment) * multiplier) || 0;
        return Math.max(10, Math.floor(Math.sqrt(minAtk * minAtk * minDef * minSta) / 10));
    }
    return 0;
}


// MARK: - Init Filter

function populateImage (row, type, set, meta) {
    const input = row.image;
    switch (input.type) {
        case 'img':
            return `<div class="filter-image-holder"><img class="lazy_load" data-src="/img/${input.path}"/></div>`;
        case 'pokemon':
            return `<div class="filter-image-holder"><img class="lazy_load" data-src="${availableIconStyles[selectedIconStyle].path}/${getPokemonIcon(input.pokemonId, input.form)}.png"/></div>`;
        default:
            return input;
    }
}

function loadPokemonFilter () {
    const table = $('#table-filter-pokemon').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_pokemon_table_empty'),
            zeroRecords: i18n('filter_pokemon_table_empty')
        },
        rowGroup: {
            dataSrc: 'type',
            /*
            startRender: function(rows, group, level) {
                return $('<tr/>')
                    .append('<td style="background-color: #1a1a1a;">' + group + '</td>');
            }
            */
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' },
            { data: 'size' }
        ],
        ajax: {
            url: '/api/get_data?show_pokemon_filter=true',
            dataSrc: 'data.pokemon_filters',
            async: true,
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3, 4],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-pokemon tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterPokemonModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-pokemon').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadQuestFilter () {
    const table = $('#table-filter-quest').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_quest_table_empty'),
            zeroRecords: i18n('filter_quest_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' },
            { data: 'size' }
        ],
        ajax: {
            url: '/api/get_data?show_quest_filter=true',
            dataSrc: 'data.quest_filters',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3, 4],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-quest tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterQuestModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-quest').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadRaidFilter () {
    const table = $('#table-filter-raid').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_raid_table_empty'),
            zeroRecords: i18n('filter_raid_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' },
            { data: 'size' }
        ],
        ajax: {
            url: '/api/get_data?show_raid_filter=true',
            dataSrc: 'data.raid_filters',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3, 4],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-raid tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterRaidModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-raid').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadGymFilter () {
    const table = $('#table-filter-gym').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_gym_table_empty'),
            zeroRecords: i18n('filter_gym_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' },
            { data: 'size' }
        ],
        ajax: {
            url: '/api/get_data?show_gym_filter=true',
            dataSrc: 'data.gym_filters',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3, 4],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-gym tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterGymModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-gym').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadPokestopFilter () {
    const table = $('#table-filter-pokestop').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_pokestop_table_empty'),
            zeroRecords: i18n('filter_pokestop_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' },
            { data: 'size' }
        ],
        ajax: {
            url: '/api/get_data?show_pokestop_filter=true',
            dataSrc: 'data.pokestop_filters',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3, 4],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-pokestop tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterPokestopModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-pokestop').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadInvasionFilter () {
    const table = $('#table-filter-invasion').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_invasion_table_empty'),
            zeroRecords: i18n('filter_invasion_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' },
            { data: 'size' }
        ],
        ajax: {
            url: '/api/get_data?show_invasion_filter=true',
            dataSrc: 'data.invasion_filters',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3, 4],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-invasion tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterInvasionModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-invasion').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadSpawnpointFilter () {
    const table = $('#table-filter-spawnpoint').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_spawnpoint_table_empty'),
            zeroRecords: i18n('filter_spawnpoint_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' },
            { data: 'size' }
        ],
        ajax: {
            url: '/api/get_data?show_spawnpoint_filter=true',
            dataSrc: 'data.spawnpoint_filters',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3, 4],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-spawnpoint tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterSpawnpointModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-spawnpoint').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadNestFilter () {
    const table = $('#table-filter-nest').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_nest_table_empty'),
            zeroRecords: i18n('filter_nest_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' },
            { data: 'size' }
        ],
        ajax: {
            url: '/api/get_data?show_nest_filter=true',
            dataSrc: 'data.nest_filters',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3, 4],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-nest tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterNestModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-nest').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadWeatherFilter () {
    const table = $('#table-filter-weather').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_weather_table_empty'),
            zeroRecords: i18n('filter_weather_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' }
        ],
        ajax: {
            url: '/api/get_data?show_weather_filter=true',
            dataSrc: 'data.weather_filters',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-weather tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterWeatherModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-weather').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadDeviceFilter () {
    const table = $('#table-filter-device').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_device_table_empty'),
            zeroRecords: i18n('filter_device_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: populateImage, width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' },
            { data: 'size' }
        ],
        ajax: {
            url: '/api/get_data?show_device_filter=true',
            dataSrc: 'data.device_filters',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3, 4],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: '50vh',
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-filter-device tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#filterDeviceModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-filter-device').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadSettings () {
    const scrollHeight = $(document).height() * 0.5;
    const table = $('#table-settings').DataTable({
        language: {
            search: i18n('filter_table_search'),
            emptyTable: i18n('filter_settings_table_empty'),
            zeroRecords: i18n('filter_settings_table_empty')
        },
        rowGroup: {
            dataSrc: 'type'
        },
        autoWidth: false,
        columns: [
            { data: 'image', width: '5%', className: 'details-control' },
            { data: 'name', width: '15%' },
            {
                data: {
                    _: 'id.formatted',
                    sort: 'id.sort'
                },
                width: '5%'
            },
            { data: 'filter' }
        ],
        ajax: {
            url: '/api/get_settings',
            dataSrc: 'data.settings',
            async: true
        },
        info: false,
        order: [[2, 'asc']],
        'search.caseInsensitive': true,
        columnDefs: [{
            targets: [0, 3],
            orderable: false
        }, {
            type: 'num',
            targets: 2
        }],
        deferRender: true,
        scrollY: scrollHeight,
        scrollCollapse: false,
        scroller: true,
        lengthChange: false,
        dom: 'lfrti',
        drawCallback: function (settings) {
            $('.lazy_load').each(function () {
                const img = $(this);
                img.removeClass('lazy_load');
                img.attr('src', img.data('src'));
            });

            $('.select-button-new').each(function (button) {
                manageSelectButton($(this), true);
            });
            $('.configure-button-new').each(function (button) {
                manageConfigureButton($(this), true);
            });
        },
        responsive: true
    });

    $('#table-settings tbody').on('click', 'td.details-control', function () {
        $('.select-button-new').each(function (button) {
            manageSelectButton($(this), true);
        });
        $('.configure-button-new').each(function (button) {
            manageConfigureButton($(this), true);
        });
    });

    table.on('search.dt', function () {
        $('tr').each(function () {
            const tr = $(this).closest('tr');
            const row = table.row(tr);
            if (row.child.isShown()) {
                row.child.hide();
                tr.removeClass('parent');
            }
        });
    });

    $('#settingsModal').on('shown.bs.modal', function () {
        const dataTable = $('#table-settings').DataTable();
        dataTable.responsive.recalc();
        dataTable.columns.adjust();
    });
}

function loadFilterSettings (e) {
    const file = e.target.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function (file) {
        const contents = file.target.result;
        const obj = JSON.parse(contents);

        showGyms = obj.show_gyms;
        gymFilterNew = obj.gym;
        store('show_gyms', showGyms);
        store('gym_filter', JSON.stringify(gymFilterNew));

        showRaids = obj.show_raids;
        raidFilterNew = obj.raid;
        store('show_raids', showRaids);
        store('raid_filter', JSON.stringify(raidFilterNew));

        showPokemon = obj.show_pokemon;
        pokemonFilterNew = obj.pokemon;
        store('show_pokemon', showPokemon);
        store('pokemon_filter', JSON.stringify(pokemonFilterNew));

        showQuests = obj.show_quests;
        questFilterNew = obj.quest;
        store('show_quests', showQuests);
        store('quest_filter', JSON.stringify(questFilterNew));

        showPokestops = obj.show_pokestops;
        pokestopFilterNew = obj.pokestop;
        store('show_pokestops', showPokestops);
        store('pokestop_filter', JSON.stringify(pokestopFilterNew));

        showInvasions = obj.show_invasions;
        invasionFilterNew = obj.invasion;
        store('show_invasions', showInvasions);
        store('invasion_filter', JSON.stringify(invasionFilterNew));

        showSpawnpoints = obj.show_spawnpoints;
        spawnpointFilterNew = obj.spawnpoint;
        store('show_spawnpoints', showSpawnpoints);
        store('spawnpoint_filter', JSON.stringify(spawnpointFilterNew));

        showNests = obj.show_nests;
        nestFilterNew = obj.nest;
        store('show_nests', showNests);
        store('nest_filter', JSON.stringify(nestFilterNew));

        showCells = obj.show_cells;
        store('show_cells', showCells);

        showSubmissionCells = obj.show_submission_cells;
        store('show_submission_cells"', showSubmissionCells);

        showWeather = obj.show_weather;
        weatherFilterNew = obj.weather;
        store('show_weather', showWeather);
        store('weather_filter', JSON.stringify(weatherFilterNew));

        showScanAreas = obj.show_scanareas;
        store('show_scanareas', showScanAreas);

        showDevices = obj.show_devices;
        deviceFilterNew = obj.device;
        store('show_devices', showDevices);
        store('device_filter', JSON.stringify(deviceFilterNew));

        showRaidTimers = obj.show_raid_timers;
        store('show_raid_timers', showRaidTimers);

        showInvasionTimers = obj.show_invasion_timers;
        store('show_invasion_timers', showInvasionTimers);

        if (showGyms) {
            $('#show-gyms').addClass('active');
            $('#hide-gyms').removeClass('active');
        } else {
            $('#hide-gyms').addClass('active');
            $('#show-gyms').removeClass('active');
        }

        if (showRaids) {
            $('#show-raids').addClass('active');
            $('#hide-raids').removeClass('active');
        } else {
            $('#hide-raids').addClass('active');
            $('#show-raids').removeClass('active');
        }

        if (showPokestops) {
            $('#show-pokestops').addClass('active');
            $('#hide-pokestops').removeClass('active');
        } else {
            $('#hide-pokestops').addClass('active');
            $('#show-pokestops').removeClass('active');
        }

        if (showInvasions) {
            $('#show-invasions').addClass('active');
            $('#hide-invasions').removeClass('active');
        } else {
            $('#hide-invasions').addClass('active');
            $('#show-invasions').removeClass('active');
        }

        if (showQuests) {
            $('#show-quests').addClass('active');
            $('#hide-quests').removeClass('active');
        } else {
            $('#hide-quests').addClass('active');
            $('#show-quests').removeClass('active');
        }

        if (showPokemon) {
            $('#show-pokemon').addClass('active');
            $('#hide-pokemon').removeClass('active');
        } else {
            $('#hide-pokemon').addClass('active');
            $('#show-pokemon').removeClass('active');
        }

        if (showSpawnpoints) {
            $('#show-spawnpoints').addClass('active');
            $('#hide-spawnpoints').removeClass('active');
        } else {
            $('#hide-spawnpoints').addClass('active');
            $('#show-spawnpoints').removeClass('active');
        }

        if (showNests) {
            $('#show-nests').addClass('active');
            $('#hide-nests').removeClass('active');
        } else {
            $('#hide-nests').addClass('active');
            $('#show-nests').removeClass('active');
        }

        if (showCells) {
            $('#show-cells').addClass('active');
            $('#hide-cells').removeClass('active');
        } else {
            $('#hide-cells').addClass('active');
            $('#show-cells').removeClass('active');
        }

        if (showSubmissionCells) {
            $('#show-submission-cells').addClass('active');
            $('#hide-submission-cells').removeClass('active');
        } else {
            $('#hide-submission-cells').addClass('active');
            $('#show-submission-cells').removeClass('active');
        }

        if (showWeather) {
            $('#show-weather').addClass('active');
            $('#hide-weather').removeClass('active');
        } else {
            $('#hide-weather').addClass('active');
            $('#show-weather').removeClass('active');
        }

        if (showScanAreas) {
            $('#show-scanareas').addClass('active');
            $('#hide-scanareas').removeClass('active');
        } else {
            $('#hide-scanareas').addClass('active');
            $('#show-scanareas').removeClass('active');
        }

        if (showDevices) {
            $('#show-devices').addClass('active');
            $('#hide-devices').removeClass('active');
        } else {
            $('#hide-devices').addClass('active');
            $('#show-devices').removeClass('active');
        }

        $('#table-filter-pokemon').DataTable().rows().invalidate('data').draw(false);
        $('#table-filter-raid').DataTable().rows().invalidate('data').draw(false);
        $('#table-filter-gym').DataTable().rows().invalidate('data').draw(false);
        $('#table-filter-pokestop').DataTable().rows().invalidate('data').draw(false);
        $('#table-filter-quest').DataTable().rows().invalidate('data').draw(false);
        $('#table-filter-spawnpoint').DataTable().rows().invalidate('data').draw(false);
        $('#table-filter-nest').DataTable().rows().invalidate('data').draw(false);
        $('#table-filter-device').DataTable().rows().invalidate('data').draw(false);
    };
    reader.readAsText(file);
}

function clearSiteCache(type) {
    if (type === 'storage') {
        localStorage.clear();
        //return;
    }
    if (window.location.reload.length == 1) {
        window.location.reload(true);
    } else {
        window.location.href = '/purge/?target=' + encodeURIComponent(window.location.pathname);
    }
}

function registerFilterButtonCallbacks() {
    // Pokemon filter buttons
    $('#reset-pokemon-filter').on('click', function (event) {
        const defaultPokemonFilter = {};
        let i;
        for (i = 1; i <= maxPokemonId; i++) {
            const pkmn = masterfile.pokemon[i];
            const forms = Object.keys(pkmn.forms);
            for (let j = 0; j < forms.length; j++) {
                const formId = forms[j];
                if (skipForms.includes(pkmn.forms[formId].name)) {
                    // Skip Shadow and Purified forms
                    continue;
                }
                const id = formId === '0' ? i : i + '-' + formId;
                defaultPokemonFilter[id] = { show: true, size: 'normal' };
            }
        }
        defaultPokemonFilter.iv_and = { on: pokemonRarity.Default.ivAnd.enabled, filter: pokemonRarity.Default.ivAnd.value };
        defaultPokemonFilter.iv_or = { on: pokemonRarity.Default.ivOr.enabled, filter: pokemonRarity.Default.ivOr.value };
        defaultPokemonFilter.pvp_and = { on: pokemonRarity.Default.pvpAnd.enabled, filter: pokemonRarity.Default.pvpAnd.value };
        defaultPokemonFilter.pvp_or = { on: pokemonRarity.Default.pvpOr.enabled, filter: pokemonRarity.Default.pvpOr.value };
        defaultPokemonFilter.big_karp = { show: false, size: 'normal' };
        defaultPokemonFilter.tiny_rat = { show: false, size: 'normal' };

        //store('pokemon_filter', JSON.stringify(defaultPokemonFilter));
        pokemonFilterNew = defaultPokemonFilter;

        $('#table-filter-pokemon').DataTable().rows().invalidate('data').draw(false);
    });

    $('#reset-common-pokemon-filter').on('click', function(event) {
        setPokemonFilters('common', true);
    });

    $('#reset-uncommon-pokemon-filter').on('click', function(event) {
        setPokemonFilters('uncommon', true);
    });

    $('#reset-rare-pokemon-filter').on('click', function(event) {
        setPokemonFilters('rare', true);
    });

    $('#reset-ultra-pokemon-filter').on('click', function(event) {
        setPokemonFilters('ultra', true);
    });

    $('#reset-regional-pokemon-filter').on('click', function(event) {
        setPokemonFilters('regional', true);
    });

    $('#reset-event-pokemon-filter').on('click', function(event) {
        setPokemonFilters('eventP', true);
    });

    $('#reset-kanto-pokemon-filter').on('click', function(event) {
        setPokemonFilters('kanto', true);
    });

    $('#reset-johto-pokemon-filter').on('click', function(event) {
        setPokemonFilters('johto', true);
    });

    $('#reset-hoenn-pokemon-filter').on('click', function(event) {
        setPokemonFilters('hoenn', true);
    });

    $('#reset-sinnoh-pokemon-filter').on('click', function(event) {
        setPokemonFilters('sinnoh', true);
    });

    $('#reset-unova-pokemon-filter').on('click', function(event) {
        setPokemonFilters('unova', true);
    });

    $('#reset-alolan-pokemon-filter').on('click', function(event) {
        setPokemonFilters('alolan', true);
    });

    $('#reset-galarian-pokemon-filter').on('click', function(event) {
        setPokemonFilters('galarian', true);
    });

    $('#disable-all-pokemon-filter').on('click', function (event) {
        const defaultPokemonFilter = {};
        let i;
        for (i = 1; i <= maxPokemonId; i++) {
            const pkmn = masterfile.pokemon[i];
            const forms = Object.keys(pkmn.forms);
            for (let j = 0; j < forms.length; j++) {
                const formId = forms[j];
                if (skipForms.includes(pkmn.forms[formId].name)) {
                    // Skip Shadow and Purified forms
                    continue;
                }
                const id = formId === '0' ? i : i + '-' + formId;
                defaultPokemonFilter[id] = { show: false, size: pokemonFilterNew[id].size, filter: pokemonFilterNew[id].filter };
            }
        }
        defaultPokemonFilter.iv_and = { on: false, filter: pokemonFilterNew.iv_and.filter };
        defaultPokemonFilter.iv_or = { on: false, filter: pokemonFilterNew.iv_or.filter };
        defaultPokemonFilter.pvp_and = { on: false, filter: pokemonFilterNew.pvp_and.filter };
        defaultPokemonFilter.pvp_or = { on: false, filter: pokemonFilterNew.pvp_or.filter };
        defaultPokemonFilter.big_karp = { show: false, size: 'normal' };
        defaultPokemonFilter.tiny_rat = { show: false, size: 'normal' };

        //store('pokemon_filter', JSON.stringify(defaultPokemonFilter));
        pokemonFilterNew = defaultPokemonFilter;

        $('#table-filter-pokemon').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-common-pokemon-filter').on('click', function(event) {
        setPokemonFilters('common', false);
    });

    $('#disable-uncommon-pokemon-filter').on('click', function(event) {
        setPokemonFilters('uncommon', false);
    });

    $('#disable-rare-pokemon-filter').on('click', function(event) {
        setPokemonFilters('rare', false);
    });

    $('#disable-ultra-pokemon-filter').on('click', function(event) {
        setPokemonFilters('ultra', false);
    });

    $('#disable-regional-pokemon-filter').on('click', function(event) {
        setPokemonFilters('regional', false);
    });

    $('#disable-event-pokemon-filter').on('click', function(event) {
        setPokemonFilters('eventP', false);
    });

    $('#disable-kanto-pokemon-filter').on('click', function(event) {
        setPokemonFilters('kanto', false);
    });

    $('#disable-johto-pokemon-filter').on('click', function(event) {
        setPokemonFilters('johto', false);
    });

    $('#disable-hoenn-pokemon-filter').on('click', function(event) {
        setPokemonFilters('hoenn', false);
    });

    $('#disable-sinnoh-pokemon-filter').on('click', function(event) {
        setPokemonFilters('sinnoh', false);
    });

    $('#disable-unova-pokemon-filter').on('click', function(event) {
        setPokemonFilters('unova', false);
    });

    $('#disable-alolan-pokemon-filter').on('click', function(event) {
        setPokemonFilters('alolan', false);
    });

    $('#disable-galarian-pokemon-filter').on('click', function(event) {
        setPokemonFilters('galarian', false);
    });
    
    
    $('#quick-start-pokemon-filter').on('click', function(event) {
        const defaultPokemonFilter = {};
        let i;
        for (i = 1; i <= maxPokemonId; i++) {
            const pkmn = masterfile.pokemon[i];
            const forms = Object.keys(pkmn.forms);
            for (let j = 0; j < forms.length; j++) {
                const formId = forms[j];
                if (skipForms.includes(pkmn.forms[formId].name)) {
                    // Skip Shadow and Purified forms
                    continue;
                }
                const id = formId === '0' ? i : i + '-' + formId;
                defaultPokemonFilter[id] = { show: isQuickStartPokemon(i) === true, size: 'normal' };
            }
        }

        defaultPokemonFilter.iv_and = { on: pokemonRarity.quickStart.ivAnd.enabled, filter: pokemonRarity.quickStart.ivAnd.value };
        defaultPokemonFilter.iv_or = { on: pokemonRarity.quickStart.ivOr.enabled, filter: pokemonRarity.quickStart.ivOr.value };
        defaultPokemonFilter.pvp_and = { on: pokemonRarity.quickStart.pvpAnd.enabled, filter: pokemonRarity.quickStart.pvpAnd.value };
        defaultPokemonFilter.pvp_or = { on: pokemonRarity.quickStart.pvpOr.enabled, filter: pokemonRarity.quickStart.pvpOr.value };
        defaultPokemonFilter.big_karp = { show: false, size: 'normal' };
        defaultPokemonFilter.tiny_rat = { show: false, size: 'normal' };

        //store('pokemon_filter', JSON.stringify(defaultPokemonFilter));
        pokemonFilterNew = defaultPokemonFilter;

        $('#table-filter-pokemon').DataTable().rows().invalidate('data').draw(false);
    });

    // Quest filter buttons
    $('#reset-quest-filter').on('click', function (event) {
        const defaultQuestFilter = {};
        defaultQuestFilter['candy-count'] = { on: false, filter: '0' };
        defaultQuestFilter['stardust-count'] = { on: false, filter: '0' };
        let i;
        for (i = 0; i < availableQuestRewards.pokemon.length; i++) {
            let id = availableQuestRewards.pokemon[i];
            defaultQuestFilter['p' + id] = { show: true, size: 'normal' };
        }
        $.each(availableItems, function (index, itemId) {
            defaultQuestFilter['i' + itemId] = { show: true, size: 'normal' };
        });
        for (i = 0; i < availableQuestRewards.items.length; i++) {
            let id = availableQuestRewards.items[i];
            defaultQuestFilter['i' + id] = { show: true, size: 'normal' };
        }

        store('quest_filter', JSON.stringify(defaultQuestFilter));
        questFilterNew = defaultQuestFilter;

        $('#table-filter-quest').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-all-quest-filter').on('click', function (event) {
        const defaultQuestFilter = {};
        defaultQuestFilter['candy-count'] = { on: false, filter: '0' };
        defaultQuestFilter['stardust-count'] = { on: false, filter: '0' };
        let i;
        for (i = 0; i < availableQuestRewards.pokemon.length; i++) {
            let id = availableQuestRewards.pokemon[i];
            defaultQuestFilter['p' + id] = { show: false, size: questFilterNew['p' + id].size };
        }
        $.each(availableItems, function (index, itemId) {
            defaultQuestFilter['i' + itemId] = { show: false, size: questFilterNew['i' + itemId].size };
        });
        for (i = 0; i < availableQuestRewards.items.length; i++) {
            let id = availableQuestRewards.items[i];
            defaultQuestFilter['i' + id] = { show: false, size: questFilterNew['i' + id].size };
        }

        store('quest_filter', JSON.stringify(defaultQuestFilter));
        questFilterNew = defaultQuestFilter;

        $('#table-filter-quest').DataTable().rows().invalidate('data').draw(false);
    });

    // Raid filter buttons
    $('#reset-raid-filter').on('click', function (event) {
        const defaultRaidFilter = {};
        defaultRaidFilter.timers = { show: defaultShowRaidTimers, size: 'normal' };
        let i;
        for (i = 1; i <= 6; i++) {
            defaultRaidFilter['l' + i] = { show: true, size: 'normal' };
        }
        for (i = 0; i < availableRaidBosses.length; i++) {
            let poke = availableRaidBosses[i];
            let id = poke.form_id === 0 ? poke.id : poke.id + '-' + poke.form_id;
            defaultRaidFilter['p' + id] = { show: true, size: 'normal' };
        }

        store('raid_filter', JSON.stringify(defaultRaidFilter));
        raidFilterNew = defaultRaidFilter;

        $('#table-filter-raid').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-all-raid-filter').on('click', function (event) {
        const defaultRaidFilter = {};
        defaultRaidFilter.timers = { show: false, size: raidFilterNew.timers.size };
        let i;
        for (i = 1; i <= 6; i++) {
            defaultRaidFilter['l' + i] = { show: false, size: raidFilterNew['l' + i].size };
        }
        for (i = 0; i < availableRaidBosses.length; i++) {
            let poke = availableRaidBosses[i];
            let id = poke.form_id === 0 ? poke.id : poke.id + '-' + poke.form_id;
            defaultRaidFilter['p' + id] = { show: false, size: 'normal' };
        }

        store('raid_filter', JSON.stringify(defaultRaidFilter));
        raidFilterNew = defaultRaidFilter;

        $('#table-filter-raid').DataTable().rows().invalidate('data').draw(false);
    });

    $('#legendary-raid-filter').on('click', function (event) {
        const defaultRaidFilter = {};
        defaultRaidFilter.timers = { show: raidFilterNew.timers.show, size: raidFilterNew.timers.size };
        let i;
        for (i = 1; i <= 6; i++) {
            defaultRaidFilter['l' + i] = { show: i === 5, size: raidFilterNew['l' + i].size };
        }
        for (i = 0; i < availableRaidBosses.length; i++) {
            let poke = availableRaidBosses[i];
            let id = poke.form_id === 0 ? poke.id : poke.id + '-' + poke.form_id;
            defaultRaidFilter['p' + id] = { show: isLegendaryPokemon(poke.id) || isMythicalPokemon(poke.id), size: 'normal' };
        }

        store('raid_filter', JSON.stringify(defaultRaidFilter));
        raidFilterNew = defaultRaidFilter;

        $('#table-filter-raid').DataTable().rows().invalidate('data').draw(false);
    });

    $('#normal-raid-filter').on('click', function (event) {
        const defaultRaidFilter = {};
        defaultRaidFilter.timers = { show: raidFilterNew.timers.show, size: raidFilterNew.timers.size };
        let i;
        for (i = 1; i <= 6; i++) {
            defaultRaidFilter['l' + i] = { show: i !== 5, size: raidFilterNew['l' + i].size };
        }
        for (i = 0; i < availableRaidBosses.length; i++) {
            let poke = availableRaidBosses[i];
            let id = poke.form_id === 0 ? poke.id : poke.id + '-' + poke.form_id;
            defaultRaidFilter['p' + id] = { show: !isLegendaryPokemon(poke.id) && !isMythicalPokemon(poke.id), size: 'normal' };
        }

        store('raid_filter', JSON.stringify(defaultRaidFilter));
        raidFilterNew = defaultRaidFilter;

        $('#table-filter-raid').DataTable().rows().invalidate('data').draw(false);
    });

    // Gym filter buttons
    $('#reset-gym-filter').on('click', function (event) {
        const defaultGymFilter = {};
        let i;
        for (i = 0; i <= 3; i++) {
            defaultGymFilter['t' + i] = { show: true, size: 'normal' };
        }
        defaultGymFilter.ex = { show: false, size: 'normal' };
        defaultGymFilter.battle = { show: false, size: 'normal' };
        for (i = 0; i <= 6; i++) {
            defaultGymFilter['s' + i] = { show: true, size: 'normal' };
        }

        store('gym_filter', JSON.stringify(defaultGymFilter));
        gymFilterNew = defaultGymFilter;

        $('#table-filter-gym').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-all-gym-filter').on('click', function (event) {
        const defaultGymFilter = {};
        let i;
        for (i = 0; i <= 3; i++) {
            defaultGymFilter['t' + i] = { show: false, size: gymFilterNew['t' + i].size };
        }
        defaultGymFilter.ex = { show: false, size: gymFilterNew.ex.size };
        defaultGymFilter.battle = { show: false, size: gymFilterNew.ex.size };
        for (i = 0; i <= 6; i++) {
            defaultGymFilter['s' + i] = { show: false, size: gymFilterNew['s' + i].size };
        }

        store('gym_filter', JSON.stringify(defaultGymFilter));
        gymFilterNew = defaultGymFilter;

        $('#table-filter-gym').DataTable().rows().invalidate('data').draw(false);
    });

    // Pokestop filter buttons
    $('#reset-pokestop-filter').on('click', function (event) {
        const defaultPokestopFilter = {};
        defaultPokestopFilter.normal = { show: true, size: 'normal' };
        for (let i = 1; i < 5; i++) {
            defaultPokestopFilter['l' + i] = { show: true, size: 'normal' };
        }

        store('pokestop_filter', JSON.stringify(defaultPokestopFilter));
        pokestopFilterNew = defaultPokestopFilter;

        $('#table-filter-pokestop').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-all-pokestop-filter').on('click', function (event) {
        const defaultPokestopFilter = {};
        defaultPokestopFilter.normal = { show: false, size: pokestopFilterNew.normal.size };
        for (let i = 1; i < 5; i++) {
            defaultPokestopFilter['l' + i] = { show: false, size: pokestopFilterNew['l' + i].size };
        }

        store('pokestop_filter', JSON.stringify(defaultPokestopFilter));
        pokestopFilterNew = defaultPokestopFilter;

        $('#table-filter-pokestop').DataTable().rows().invalidate('data').draw(false);
    });

    // Invasion filter buttons
    $('#reset-invasion-filter').on('click', function (event) {
        const defaultInvasionFilter = {};
        defaultInvasionFilter.timers = { show: defaultShowInvasionTimers, size: 'normal' };
        for (let i = 1; i <= 50; i++) {
            defaultInvasionFilter['i' + i] = { show: true, size: 'normal' };
        }

        store('invasion_filter', JSON.stringify(defaultInvasionFilter));
        invasionFilterNew = defaultInvasionFilter;

        $('#table-filter-invasion').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-all-invasion-filter').on('click', function (event) {
        const defaultInvasionFilter = {};
        defaultInvasionFilter.timers = { show: false, size: invasionFilterNew.timers.size };
        for (let i = 1; i <= 50; i++) {
            defaultInvasionFilter['i' + i] = { show: false, size: invasionFilterNew['i' + i].size };
        }

        store('invasion_filter', JSON.stringify(defaultInvasionFilter));
        invasionFilterNew = defaultInvasionFilter;

        $('#table-filter-invasion').DataTable().rows().invalidate('data').draw(false);
    });

    // Spawnpoint filter buttons
    $('#reset-spawnpoint-filter').on('click', function (event) {
        const defaultSpawnpointFilter = {};
        defaultSpawnpointFilter['no-timer'] = { show: true, size: 'normal' };
        defaultSpawnpointFilter['with-timer'] = { show: true, size: 'normal' };

        store('spawnpoint_filter', JSON.stringify(defaultSpawnpointFilter));
        spawnpointFilterNew = defaultSpawnpointFilter;

        $('#table-filter-spawnpoint').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-all-spawnpoint-filter').on('click', function (event) {
        const defaultSpawnpointFilter = {};
        defaultSpawnpointFilter['no-timer'] = { show: false, size: spawnpointFilterNew['no-timer'].size };
        defaultSpawnpointFilter['with-timer'] = { show: false, size: spawnpointFilterNew['with-timer'].size };

        store('spawnpoint_filter', JSON.stringify(defaultSpawnpointFilter));
        spawnpointFilterNew = defaultSpawnpointFilter;

        $('#table-filter-spawnpoint').DataTable().rows().invalidate('data').draw(false);
    });

    // Nest filter buttons
    $('#reset-nest-filter').on('click', function (event) {
        const defaultNestFilter = {};
        defaultNestFilter['avg'] = { on: false, filter: '5' };
        for (i = 0; i < availableNestPokemon.length; i++) {
            let id = availableNestPokemon[i];
            defaultNestFilter['p' + id] = { show: true, size: 'normal' };
        }

        store('nest_filter', JSON.stringify(defaultNestFilter));
        nestFilterNew = defaultNestFilter;

        $('#table-filter-nest').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-all-nest-filter').on('click', function (event) {
        const defaultNestFilter = {};
        defaultNestFilter['avg'] = { on: false, filter: '5' };
        for (i = 0; i < availableNestPokemon.length; i++) {
            let id = availableNestPokemon[i];
            defaultNestFilter['p' + id] = { show: false, size: 'normal' };
        }

        store('nest_filter', JSON.stringify(defaultNestFilter));
        nestFilterNew = defaultNestFilter;

        $('#table-filter-nest').DataTable().rows().invalidate('data').draw(false);
    });

    // Weather filter buttons
    $('#reset-weather-filter').on('click', function (event) {
        const defaultWeatherFilter = {};
        for (i = 1; i <= 7; i++) {
            defaultWeatherFilter[i] = { show: true, size: 'normal' };
        }

        store('weather_filter', JSON.stringify(defaultWeatherFilter));
        weatherFilterNew = defaultWeatherFilter;

        $('#table-filter-weather').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-all-weather-filter').on('click', function (event) {
        const defaultWeatherFilter = {};
        for (i = 1; i <= 7; i++) {
            defaultWeatherFilter[i] = { show: false, size: 'normal' };
        }

        store('weather_filter', JSON.stringify(defaultWeatherFilter));
        weatherFilterNew = defaultWeatherFilter;

        $('#table-filter-weather').DataTable().rows().invalidate('data').draw(false);
    });

    // Device filter buttons
    $('#reset-device-filter').on('click', function (event) {
        const defaultDeviceFilter = {};
        defaultDeviceFilter['online'] = { show: true, size: 'normal' };
        defaultDeviceFilter['offline'] = { show: true, size: 'normal' };

        store('device_filter', JSON.stringify(defaultDeviceFilter));
        deviceFilterNew = defaultDeviceFilter;

        $('#table-filter-device').DataTable().rows().invalidate('data').draw(false);
    });

    $('#disable-all-device-filter').on('click', function (event) {
        const defaultDeviceFilter = {};
        defaultDeviceFilter['online'] = { show: false, size: 'normal' };
        defaultDeviceFilter['offline'] = { show: false, size: 'normal' };

        store('device_filter', JSON.stringify(defaultDeviceFilter));
        deviceFilterNew = defaultDeviceFilter;

        $('#table-filter-device').DataTable().rows().invalidate('data').draw(false);
    });
}

function setPokemonFilters(type, show) {
    const defaultPokemonFilter = {};
    for (let i = 1; i <= maxPokemonId; i++) {
        const pkmn = masterfile.pokemon[i];
        const forms = Object.keys(pkmn.forms);
        for (let j = 0; j < forms.length; j++) {
            const formId = forms[j];
            if (skipForms.includes(pkmn.forms[formId].name)) {
                // Skip Shadow and Purified forms
                continue;
            }
            let matches = false;
            switch (type) {
                case 'common':   matches = isCommonPokemon(i); break;
                case 'uncommon': matches = isUncommonPokemon(i); break;
                case 'rare':     matches = isRarePokemon(i); break;
                case 'ultra':    matches = isUltraRarePokemon(i); break;
                case 'regional': matches = isRegionalPokemon(i); break;
                case 'eventP':   matches = isEventPokemon(i); break;
                case 'kanto':    matches = isKantoPokemon(i); break;
                case 'johto':    matches = isJohtoPokemon(i); break;
                case 'hoenn':    matches = isHoennPokemon(i); break;
                case 'sinnoh':   matches = isSinnohPokemon(i); break;
                case 'unova':    matches = isUnovaPokemon(i); break;
                case 'alolan':   matches = isAlolanPokemon(i, formId); break;
                case 'galarian': matches = isGalarianPokemon(i, formId); break;
            }
            const id = formId === '0' ? i : i + '-' + formId;
            if (matches) {
                defaultPokemonFilter[id] = { show: show, size: pokemonFilterNew[id].size, filter: pokemonFilterNew[id].filter };
            } else {
                defaultPokemonFilter[id] = { show: pokemonFilterNew[id].show, size: pokemonFilterNew[id].size, filter: pokemonFilterNew[id].filter };
            }
        }
    }
    defaultPokemonFilter.iv_and = { on: false, filter: pokemonFilterNew.iv_and.filter };
    defaultPokemonFilter.iv_or = { on: false, filter: pokemonFilterNew.iv_or.filter };
    defaultPokemonFilter.pvp_and = { on: false, filter: pokemonFilterNew.pvp_and.filter };
    defaultPokemonFilter.pvp_or = { on: false, filter: pokemonFilterNew.pvp_or.filter };
    defaultPokemonFilter.big_karp = { show: false, size: 'normal' };
    defaultPokemonFilter.tiny_rat = { show: false, size: 'normal' };

    //store('pokemon_filter', JSON.stringify(defaultPokemonFilter));
    pokemonFilterNew = defaultPokemonFilter;

    $('#table-filter-pokemon').DataTable().rows().invalidate('data').draw(false);
}
