# Museum assets

Slot directory for the `/lab` pixel museum. MVP currently renders tiles procedurally
(see `src/components/museum/engine/tileAtlas.ts`) — nothing needs to live here to
build and ship the MVP.

## Layout

```
tiles/                  tileset PNGs (e.g. 32x32 sheet), if/when we swap off procedural
character/              character sprite sheet (4-dir walk cycle)
thumbs/experiments/     pixel-art-ified thumbnails for experiment paintings
thumbs/works/           pixel-art-ified thumbnails for work computer screens
```

## Upgrade path (deferred polish)

To swap procedural tiles for a real pixel pack, drop a sheet here and
update the loader in `src/components/museum/engine/tileAtlas.ts` to
`drawImage` from the PNG instead of drawing procedurally.

Recommended free CC0 candidates when ready:

- **Kenney 1-Bit Pack** — https://kenney.nl/assets/1-bit-pack (monochrome, tints cleanly to cyan)
- **Kenney RPG Urban Pack** — https://kenney.nl/assets/rpg-urban-pack
- **LimeZu Modern Interior (free tier)** — https://limezu.itch.io/moderninteriors (CC-BY, cozier look)

License must be CC0 or verified compatible before committing any sprite files
here. Attribute in this README if CC-BY.

## Thumbnails

The `thumbs/experiments/` and `thumbs/works/` slots are unused by the MVP —
paintings go live (hybrid mode) and work desk "screens" render the existing
`/public/images/works/*.png` assets with pixelated scaling. If we later want
dedicated pixelated thumbnails, drop them here as 64×48 PNGs named
`{slug}.png` and wire them through the same loader.
