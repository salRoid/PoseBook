# For the generating agent

Your ONLY job here: **generate body-part silhouette images and drop them in
`parts/inbox/`.** Everything else — naming validation, vectorising, anchoring,
assembling them into exercise figures — is code, and it runs on this side.
You never write into `parts/manifest.json`, `dist/`, or `poses/`.

## The loop

```bash
npm run missing        # which parts are absent, each with its exact prompt
#   …generate, LOOK AT IT, save as parts/inbox/<part>--<m|f>.png…
npm run ingest         # validate → trace to vector → anchor → manifest
npm run build          # re-render every exercise with the new parts
```

Open `dist/sheet.html` after a build and look at the figures. A part that is
off its anchors assembles into a dislocated body — that is the failure mode
here, and it is visible immediately.

## The rules

- **Use the prompt `npm run missing` prints, verbatim.** Prompts are generated
  from `parts/spec.mjs` — the single source of truth for the part list, canvas
  sizes and anchor positions. Do not restate or improvise them.
- **One part per image, nothing else in frame.** Solid single-colour
  silhouette on white or transparency. No outline style, no shading, no
  background, no face features.
- **Anchors are a drawing convention, not a marker.** The part must be drawn
  so its joints sit at the spec's canvas coordinates — that is what lets the
  engine place it with no detection step.
- **Joint ends rounded and slightly overlong** — parts overlap at the joints
  to hide seams when a limb bends. A part that stops dead at its anchor
  leaves a gap at every bent knee and elbow.
- **A filename that is not `<part>--<m|f>.png` for a part in the spec is
  rejected** by ingest. A filename cannot invent a part; adding one is a code
  change in `parts/spec.mjs`.
- Poses are none of your business: `poses/*.mjs` is settled joint-angle data,
  and the parts you draw are its skin, not its replacement.

Why parts and not whole poses: a part is drawn once and reused in every frame
of every exercise, so there is no frame-to-frame consistency to lose — the
thing that sank generated exercise art before (`Health/ATTRIBUTION.md`, 15
rejections). Keep it that way.
