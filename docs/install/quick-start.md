# Quick Start

!!! note
    **Prerequisites**:
    Existing [RDM](https://github.com/RealDeviceMap/RealDeviceMap) or [DataParser](https://github.com/versx/DataParser) style database

1. Install [nodejs] v12
1. Clone the repository

    ```sh
    git clone https://github.com/versx/MapJS && cd MapJS
    ```

1. Install dependencies

    ```sh
    npm run update
    ```

1. Create your project config

    ```sh
    cp src/configs/config.example.json src/configs/config.json
    ```

1. Fill out config. See [config#discord] for Discord Auth instructions.

    ```sh
    vi src/configs/config.json
    ```


1. Create/copy a `static/custom/nests.json` file to show nests ([GeoJSON] format)
1. Create/copy a `static/custom/areas.json` file to show scan areas ([GeoJSON] format)
1. Run `npm run start`
1. Access the map via [http://machineip:port/]()


[nodejs]: https://nodejs.org/en/download/
[config#discord]: ../configuration/config.md#discord
[GeoJSON]: ../configuration/geojson.md
