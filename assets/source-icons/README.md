# Source icons

Upstream sources for the small footer icons in `assets/inline/`, baked by
`scripts/generate-assets.mjs`. Nothing here is referenced by the README directly.

All files come from [Simple Icons](https://github.com/simple-icons/simple-icons)
and are distributed under CC0 1.0. The depicted brand logos remain trademarks of
their respective owners and are used here only to link to those services.

The generator paints every icon the same muted gray (`#7d8590`), which stays
legible on both GitHub themes, so no light/dark pair is needed. The per-icon
`scale` is optical correction: the round Telegram and GitHub marks fill their
box edge to edge, while the X wordmark leaves its corners empty, so at equal
box size the circles would read as heavier.

To add or refresh an icon:

```sh
curl -sfL https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/<name>.svg -o simple-<name>.svg
node ../../scripts/generate-assets.mjs
```
