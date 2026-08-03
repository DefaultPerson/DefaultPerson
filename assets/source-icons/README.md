# Source icons

Upstream icon sources baked into `assets/buttons/` and `assets/projects/` by
`scripts/generate-assets.mjs`. Nothing here is referenced by the README directly.

| File | Upstream | License |
| --- | --- | --- |
| `simple-telegram.svg`, `simple-github.svg`, `simple-x.svg` | [Simple Icons](https://github.com/simple-icons/simple-icons) | CC0 1.0 |
| `lucide-radar.svg`, `lucide-rss.svg` | [Lucide](https://github.com/lucide-icons/lucide) | ISC |

Simple Icons ships the icon files under CC0, but the depicted brand logos remain
trademarks of their respective owners and are used here only to link to those
services.

To refresh a source icon:

```sh
curl -sfL https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/telegram.svg -o simple-telegram.svg
curl -sfL https://cdn.jsdelivr.net/npm/lucide-static@latest/icons/radar.svg -o lucide-radar.svg
node ../../scripts/generate-assets.mjs
```
