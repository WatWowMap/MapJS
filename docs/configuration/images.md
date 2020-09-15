# Images

Icons for this project use a very specific naming scheme that allows for advanced features like showing gender, costume, form, mega and evolution. Additional if an icon doesn't exist as part of the icon repo we can fall back to the normal form.

To learn more about this scheme please see the [Mygod/pokemon-icon-postprocessor] repo, which also includes notes on migrating.

## icon names

All icons assume the `.png` file format due to easy web compression, small file size and transparency layer.

(directory structure is optional)

```
pokemon:
* <pokemon id>[-e<temp evolution id>][-f<form id>][-c<costume id>][-g<gender id>][-shiny]

gym:
* 0[-battle][-sponsor].png for neutral gyms
* <teamid>[-battle][-sponsor][-short|-tall][-<slot count>]
(legacy: slot count)

raid:
* <raid level>[-hatched|-complete][-ex].png

pokestop:
* (pokestop|cooldown)[-m<item id>][-sponsor][-i[<invasion character>]]
(legacy: invasion character)

invasion characters:
* <invasion character>

Quest reward:
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

Other misc: (very optional)

* type - <pokemon type id>
* team logo - <team color>
* weather - <weather id>
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
