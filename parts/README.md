# parts/ — the body-part library

`inbox/` is where generated part images land (`<part>--<m|f>.png` — the 20
files `../PARTS.md` specifies). Vectorised, anchored parts live here as
`manifest.json` once ingested. A part missing from the manifest falls back to
stroke rendering, so the library can be filled in any order.
