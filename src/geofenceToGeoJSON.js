/**
 * Credits: https://gist.github.com/moriakaice
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
    console.error('Error: No geofence directory provided via command line arguments.');
    return;
}
const geofencesFolder = path.resolve(__dirname, '../' + args[0]);
if (!fs.existsSync(geofencesFolder)) {
    console.error('Error: Geofence directory does not exist:', geofencesFolder);
    return;
}

const geoJSON = {
    type: 'FeatureCollection',
    features: [],
};

fs.readdir(geofencesFolder, (err, files) => {
    if (err) {
        console.error(err);
        return;
    }
    for (let i = 0; i < files.length; i++) {
        const file = path.resolve(geofencesFolder, files[i]);
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log('Converting ini geofence file to geoJSON format', file);
            const fences = data.match(/\[([^\]]+)\]([^[]*)/g);
            fences.forEach(fence => {
                const geofence = {
                    type: 'Feature',
                    properties: {
                        name: ''
                    },
                    geometry: {
                        type: 'Polygon',
                        coordinates: [[]]
                    }
                };
                geofence.properties.name = fence.match(/\[([^\]]+)\]/)[1];
                geofence.geometry.coordinates[0] = fence.match(/[0-9\-.]+,\s*[0-9\-.]+/g).map(point => [parseFloat(point.split(',')[1]), parseFloat(point.split(',')[0])]);
                geofence.geometry.coordinates[0].push(geofence.geometry.coordinates[0][0]);

                geoJSON.features.push(geofence);
            });
            fs.writeFile('areas.json', JSON.stringify(geoJSON, null, 2), 'utf8', () => { });
            console.log('areas.json file saved.');
        });
    }
});