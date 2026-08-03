# Source icons

Upstream icon sources baked into `assets/stack/` and `assets/inline/` by
`scripts/generate-assets.mjs`. Nothing here is referenced by the README directly.

All files come from [Simple Icons](https://github.com/simple-icons/simple-icons)
and are distributed under CC0 1.0. The depicted brand logos remain trademarks of
their respective owners and are used here only to label a stack or link to a
service.

Accent colors in the generator are the official Simple Icons brand hex, except
for Rust and Ethereum: their brand values (`#000000` and `#3C3C3D`) disappear
against the dark plate, so those two carry a lightened dark-theme variant.

To add or refresh an icon:

```sh
curl -sfL https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/<name>.svg -o simple-<name>.svg
node ../../scripts/generate-assets.mjs
```
