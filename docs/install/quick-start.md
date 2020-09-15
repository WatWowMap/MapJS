# Quick Start

!!! note
    **Prerequisites**:
    Existing [RDM](https://github.com/RealDeviceMap/RealDeviceMap) or [DataParser](https://github.com/versx/DataParser) style database

1. Install nodejs v12
1. Clone the repository

    ```sh
    git clone https://github.com/versx/MapJS
    ```

1. Install dependencies

    ```sh
    npm run update
    ```

1. Copy config

    ```sh
    cp src/configs/config.example.json src/configs/config.json
    ```

1. Fill out config

    ```sh
    vi src/configs/config.json
    ```

1. Create/copy a `static/custom/nests.json` file to show nests (geoJSON file format)
1. Create/copy a `static/custom/areas.json` file to show scan areas (geoJSON file format, see below)
1. Run `npm run start`
1. Access via [http://machineip:port/]() login using your Discord account
