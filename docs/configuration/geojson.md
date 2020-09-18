# GeoJSON

MapJS uses a GeoJSON formatted file for both nest polygons and scan areas. While both
of these features are optional the placeholder json files must exist.

## Nests

This is generated via the external [PMSFnestScript] project and support is
given via the [PMSF Discord](). Once the script is ran move the `nest.json`
file to `/path/to/MapJS/static/custom/nest.json`.

## Scan Area

This `areas.json` file is used to show city/region boundaries on the map. You can
generate it yourself via multiple free online websites, a few are listed below:

- [geojson.io](https://geojson.io/)
- [geoman.io](https://geoman.io/geojson-editor)
- [RDM Tools](https://github.com/PickleRickVE/RealDeviceMap-tools) (self hosted)

### Convert INI to GeoJSON

To easily convert INI sytle geofence format files to GeoJSON format you can use the
following method. This is mainly used for the `areas.json` file to show scan areas.

1. Create `geofences` directory in root of project (with src folder)
1. Copy your `.txt` INI format geofence files to the `geofences` folder
1. Run `npm run convert -- ./geofences/` which will convert your INI geofences to one `areas.json` GeoJSON format file in the root of the project
1. Copy `areas.json` to `static/custom/areas.json` to show the scan areas on the map

### Convert Porcale geofence to GeoJSON

To easily convert from [PoracleJS] geofence formated file into GeoJSON run the method.
This is mainly used for the `areas.json` file to show scan areas.

1. Copy your `geofence.json` file from Poracle to the root of the project folder (with src folder)
1. Run `npm run convert-poracle -- geofence.json` which will convert the file to an `areas.json` GeoJSON format file in the root of the project folder
1. Copy `areas.json` to `static/custom/areas.json` to show the scan areas on the map


[PMSF Discord]: https://discord.gg/yGujp8D
[PMSFnestScript]: https://github.com/M4d40/PMSFnestScript
[PoracleJS]: https://github.com/KartulUdus/PoracleJS
