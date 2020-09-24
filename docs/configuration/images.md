# Images

!!! warning
    This page should be considered a work in progress. As it stands, the ICONS scheme
    has not been widely adopted by the mapping community. MapJS currently **only**
    supports the Pokémon filename structure.

Images for this project use the ICONS "Intermapping Cooperative Object Naming Standard"
naming scheme.

## Using images

Images can be served either locally through MapJS or via a remote URL. If using a
remote URL an `index.json` file is required to properly support fallback.
See [config](config.md) for usage.

## ICONS structure

Users of ICONS are expected to be able to take a URL for each category of icons, and therefore there is no mandatory directory structure for ICONS.
However, if you do want to provide all possible categories, you can take the following directory structure as default.
Options marked as "Legacy" are only there to help older maps migrate from the map and might not be supported by all icon packs.
Options marked as "Unused" are not used by anyone as far as we are concerned, and are only there for futureproofing; icon packs are not mandated to support them for now.

All icons assume the `.png` file format due to easy web compression, small file size and transparency layer.
In the following templates, all IDs are references to the [proto ID](https://github.com/Furtif/POGOProtos).

```sh
.
├── gym
├── invasion
├── misc
├── pokemon
├── raid
├── reward
├── team
└── weather
```

Currently, MapJS **only** supports the Pokémon filename structure.


## Pokemon icons

The file naming scheme of ICONS for Pokemon allows for finding Pokemon icons with all in-game modifications including gender, costume, shiny, form, and mega evolutions of the Pokemon, in an *unambiguous* fashion. Additionally if an icon doesn't exist as part of the supplied icon repo we can fall back to the normal form.

To learn more about this scheme please see the [Mygod/pokemon-icon-postprocessor] repo,
which also includes notes on migrating from the more common PMSF style image structure.

Handy batch/bash script for making the `index.json` file:

```sh
python -c "import os, json; print(json.dumps(\
[os.path.splitext(file)[0] \
for file in os.listdir('.') \
if file.endswith('.png')], \
separators=(',', ':')))" > index.json
```

## Gym icons

* `0[-battle][-sponsor]` for neutral gyms
* `<teamid>[-battle][-sponsor][-short|-tall][-<slot count>]`

Legacy: slot count.


## Raid icons

`<raid level>[-hatched|-complete][-ex]`

Unused: complete, ex.


## Pokestop icons

`(pokestop|cooldown)[-m<item id>][-sponsor][-i[<invasion character>]]`

Legacy: invasion character.

Unused: cooldown.


## Quest reward icons

* `0` for fallback
* `1[-a<amount>]` for xp
* `2[-i<item id>][-a<amount>]` for item
* `3[-a<amount>]` for dust
* `4[-p<pokemon id>][-a<amount>]` for candy
* `5[-t<template id>]` for avatar
* `6[-t<template id>]` for quest
* `7` for unknown pokemon reward
* `8[-a<amount>]` for pokecoin
* `11[-i<id>][-a<amount>]` for stickers
* `12[-p<pokemon id>][-a<amount>]` for mega energy
* `<type>` for future proofing

Legacy: amount.

Unused: XP, candy, avatar, quest, unknown pokemon reward, pokecoin, stickers.


## Other misc icons

* `invasion` characters: `<invasion character>`
* `type` - `<pokemon type id>`
* `team` logo - `<team color>`
* `weather` - `<weather id>`



[Mygod/pokemon-icon-postprocessor]: https://github.com/Mygod/pokemon-icon-postprocessor
[PMSF]: https://github.com/pmsf/PMSF
