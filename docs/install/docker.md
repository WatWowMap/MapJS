# Docker Installation

!!! note
    **Prerequisites**:
    Existing [RDM](https://github.com/RealDeviceMap/RealDeviceMap) or [DataParser](https://github.com/versx/DataParser) style database.

1. Install [docker]{target=_blank}
1. Install [docker-compose]{target=_blank}
1. Clone the repository

    ```sh
    git clone https://github.com/versx/MapJS && cd MapJS
    ```

1. Copy the sample docker-compose file

    ```sh
    cp docker-compose.example.yml docker-compose.yml
    ```

1. Fill out your docker-compose.yml file

    ```sh
    vi docker-compose.yml
    ```

1. Create your project config

    ```sh
    cp src/configs/config.example.json src/configs/config.json
    ```

1. Fill out config. See [config#discord] for Discord Auth instructions.

    ```sh
    vi src/configs/config.json
    ```

1. Create/copy a `static/custom/nests.json` file to show nests ([GeoJSON] file format)
1. Create/copy a `static/custom/areas.json` file to show scan areas ([GeoJSON] file format, see below)
1. Start with `docker-compose up -d`
1. Access via [http://machineip:port/]() login using your Discord account

## Updating

1. `cd /path/to/MapJS`
1. `git pull`
1. `docker-compose build`
1. `docker-compose up -d`


[docker]: https://docs.docker.com/get-docker/
[docker-compose]: https://docs.docker.com/compose/install/
[config#discord]: ../configuration/config.md#discord
[GeoJSON]: ../configuration/geojson.md
