# parts/ — the body-part library

`inbox/` is where generated part images land (`<part>--<m|f>.png` — the 20
files `../PARTS.md` specifies). Vectorised, anchored parts live here as
`manifest.json` once ingested. A part missing from the manifest falls back to
stroke rendering, so the library can be filled in any order.

`anatomy.mjs` is the colour-reference contract: it names visible adult
anatomical regions and their colour tokens. Run `npm run author-color-details`
to write layered reference PNGs to `color-assets/anatomical/`. These layers
are intentionally not traced into the movement geometry.
