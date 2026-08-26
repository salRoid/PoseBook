# For the generating agent

Two pipelines run here. **Frames is the primary job** — the full exercise/asana
catalogue as whole-figure art. **Parts** feeds the runtime rig and continues in
parallel. Both are drop-in-inbox: everything mechanical is code on this side.

## 1 · FRAMES — whole-figure strips (the catalogue, ~700 strips)

```bash
npm run brief                    # writes dist/briefs.json — the whole queue
#   …generate each brief's strip, save EXACTLY as brief.file…
npm run ingest-frames            # cell grammar → background → split → corpus
```

**`dist/briefs.json` is the queue.** Every record carries its own `file` and
fully assembled `prompt` — use them verbatim, never paraphrase (the style
prefix is parsed from `frames/STYLE.md`, versioned, and a reworded prefix
across 700 strips is permanent drift).

- **THE ANCHOR PROTOCOL:** generate `deadlift--m` FIRST and stop for
  acceptance. Every batch afterwards is generated against that accepted
  anchor's look, and each batch's first strip is compared to it before the
  batch continues. This is how ~700 strips stay one visual system.
- All frames of one movement go in ONE image — equal square cells, side by
  side, per the brief's frame line. That is what guarantees within-movement
  consistency.
- Background must be TRANSPARENT (a dark background is tolerated and keyed;
  an opaque white one is rejected — the ink is white).
- A brief with `refs` carries rig skeleton frames: match those joint
  positions exactly. A brief without refs carries the app's own movement
  description — follow it, and expect a stricter human review on those.
- **Never generate from Bryl Lim's / everkinetic's images** (img2img, edits,
  tracing) — their art is CC BY-SA and a derivative inherits it, which
  defeats the entire ownership goal. Style comes from the contract text only.
- Work tier order: 1 (user's gap) → 2 (all asanas) → 3 → 4.

## 2 · PARTS — the articulated rig library (runtime figure)

```bash
npm run missing        # which body parts are absent, each with its prompt
#   …generate → parts/inbox/<part>--<m|f>.png…
npm run ingest         # trace → auto-register anchors → manifest
```

These power the measurement-driven, tone-driven personal figure — a different
product from catalogue art, so this queue stays open. Same rules as before:
prompts verbatim from `npm run missing`, one part per image, solid silhouette,
filenames exactly as listed (a filename cannot invent a part).

## Both pipelines

- `npm run build` re-renders everything; **open `dist/sheet.html` and LOOK.**
- A rejected file is deleted and regenerated, never routed around.
- Poses (`poses/*.mjs`) are joint-angle data owned on this side — never edit.
