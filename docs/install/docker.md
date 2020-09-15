# Docker Installation

1. Install docker
1. Install docker-compose
1. Clone the repository

    ```sh
    git clone https://github.com/versx/MapJS
    ```

1. Copy the sample docker-compose file

    ```sh
    cp docker-compose.example.yml docker-compose.yml
    ```

1. Copy config

    ```sh
    cp src/configs/config.example.json src/configs/config.json
    ```

1. (Optional) Create a Discord bot at [https://discord.com/developers](https://discord.com/developers){target=_blank} and enter the `botToken`, `clientId`, and `clientSecret` in your `config.json`
1. Fill out config

    ```sh
    vi src/configs/config.json
    ```

1. Create/copy a `static/custom/nests.json` file to show nests (geoJSON file format)
1. Create/copy a `static/custom/areas.json` file to show scan areas (geoJSON file format, see below)
1. Start with `docker-compose up -d`
1. Access via [http://machineip:port/]() login using your Discord account
