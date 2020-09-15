# Images

!!! warning
    This page is a work in progress. As it stands the ICONS scheme has not been widely
    adopted by the mapping community. The Pokémon file name structure is complete.

Images for this project use the ICONS "Intermapping Cooperative Object Naming Standard"
naming scheme. This specific file naming scheme allows for advanced features like
showing gender, costume, shiny, form, and mega evolutions of pokemon. Additional if an
icon doesn't exist as part of the supplied icon repo we can fall back to the normal form.

To learn more about this scheme please see the [Mygod/pokemon-icon-postprocessor] repo,
which also includes notes on migrating from the common PMSF style image structure.

## Using images

Images can be served either locally through MapJS or via a remote URL. If using a
remote URL an `index.json` file is required to properly support fallback.
See [config](config.md) for usage.

## ICON structure

We recommend the following directory structure. Options marked as "Legacy" are
not required for MapJS but might be needed for other mapping systems.

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

## File names explained

All icons assume the `.png` file format due to easy web compression, small file size
and transparency layer.

```sh
gym:
* 0[-battle][-sponsor] for neutral gyms
* <teamid>[-battle][-sponsor][-short|-tall][-<slot count>]
(legacy: slot count)

invasion characters:
* <invasion character id>

misc: (optional)
* pvp medals
* grass

pokemon:
* <pokemon id>[-e<temp evolution id>][-f<form id>][-c<costume id>][-g<gender id>][-shiny]

raid:
* <raid level>[-hatched|-complete][-ex]

reward:
* 0 for fallback
* 1[-a<amount>] for xp
* 2[-i<item id>][-a<amount>] for item
* 3[-a<amount>] for dust
* 4[-p<pokemon id>][-a<amount>] for candy
* 5[-t<template id>] for avatar
* 6[-t<template id>] for quest
* 7 for unknown pokemon reward
* 8[-a<amount>] for pokecoin
* 11[-i<id>][-a<amount>] for stickers
* 12[-p<pokemon id>][-a<amount>] for mega energy
* <type> for future proofing
(legacy: amount)

team: (logos for each team)
* <team id>

weather:
* <weather id>
```

## Notes for icon makers

Handy batch/bash script for making the `index.json` file:

```sh
python -c "import os, json; print(json.dumps(\
[os.path.splitext(file)[0] \
for file in os.listdir('.') \
if file.endswith('.png')], \
separators=(',', ':')))" > index.json
```

[Mygod/pokemon-icon-postprocessor]: https://github.com/Mygod/pokemon-icon-postprocessor
[PMSF]: https://github.com/pmsf/PMSF
