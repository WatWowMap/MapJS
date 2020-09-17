'use strict';

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Error: No geofence file provided via command line arguments.');
    return;
}
const inFilePath = args[0];
const outGeoJSON = {
    type: 'FeatureCollection',
    features: [],
};

fs.readFile(inFilePath, 'utf8', (err, data) => {
    if (err) {
        console.error(err);
        return;
    }
    const inGeoJSON = JSON.parse(data);
    if (inGeoJSON.length === 0) {
        console.error('Failed to parse poracle geofence file');
        return;
    }
    for (let i = 0; i < inGeoJSON.length; i++) {
        const inGeofence = inGeoJSON[i];
        console.log('Converting', inGeofence.name);
        const outGeofence = {
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
        outGeofence.properties = {
            name: inGeofence.name,
            color: inGeofence.color,
            id: inGeofence.id
        };
        for (let i = 0; i < inGeofence.path.length; i++) {
            const coord = inGeofence.path[i];
            inGeofence.path[i] = [coord[1], coord[0]];
        }
        outGeofence.geometry.coordinates[0] = inGeofence.path;
        outGeoJSON.features.push(outGeofence);
    }
    const outFilePath = path.resolve(path.dirname(inFilePath), 'areas.json');
    fs.writeFile(outFilePath, JSON.stringify(outGeoJSON, null, 2), 'utf8', () => {
        console.log(`${outFilePath} file saved.`);
    });
});