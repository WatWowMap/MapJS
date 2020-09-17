'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Error: No geofence file provided via command line arguments.');
    return;
}
const filePath = args[0];

const geoJSON = {
    type: 'FeatureCollection',
    features: [],
};

fs.readFile(filePath, (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const json = data.toString('utf8');
    const objArray = JSON.parse(json);
    if (objArray.length === 0) {
        console.error('Failed to parse poracle geofence file');
        return;
    }
    for (let i = 0; i < objArray.length; i++) {
        const obj = objArray[i];
        console.log('Converting', obj.name);
        const geofence = {
            type: 'Feature',
            properties: {
                name: '',
                color: '#000000',
                id: 0,

            },
            geometry: {
                type: 'Polygon',
                coordinates: [[]]
            }
        };
        geofence.properties.name = obj.name;
        geofence.properties.color = obj.color;
        geofence.properties.id = obj.id;
        geofence.geometry.coordinates[0] = obj.path;

        geoJSON.features.push(geofence);
    }
    const savePath = path.resolve(path.dirname(filePath), 'areas.json');
    fs.writeFile(savePath, JSON.stringify(geoJSON, null, 2), 'utf8', () => { });
    console.log('areas.json file saved.');
});