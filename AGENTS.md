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

## The four rules that keep costing us frames

**1. The ink is `currentColor`, never white.** Frame SVGs paint a
`currentColor` rect through a mask made from the PNG. Do not "simplify" that
back to a bare `<image>`: it bakes white pixels, which are invisible on a
light screen and cannot follow light/dark mode.

**2. Never fix art by changing the ALPHA MATH.** On 2026-08-29 a hard alpha
threshold (`L >= 170 ? 255 : 0`) was added to fix a grey matte on three files,
then `--reingest` applied it to all 131 — it destroyed anti-aliasing corpus-
wide, fattening every stroke into a blob and promoting faint seams into solid
white lines. Reverted. Alpha handling is anti-aliased on purpose. If a few
source files carry a baked-in checkerboard or matte, that is a GENERATION
defect in those files: regenerate them. Never reprocess the whole corpus to
work around a handful of bad inputs, and never run `--reingest` to "fix" art.

**3. The cut comes from the INK, never from `width / N`.** `ingest-frames`
finds each cut in a real gutter, erases drawn divider lines, and hands each
connected ink component WHOLE to one frame — because figures are drawn wider
than their nominal third and an arithmetic split leaves a foot from frame 2
standing in frame 1 (81 of 509 strips had ink crossing the boundary). Do not
"simplify" it back to equal columns, and do not slice a component to make a
frame fit. A run that reports `forced cut … no gutter` is telling you two
figures touch in the source: look at that strip.

**4. A frame facing the wrong way is FLIPPED, not hand-edited.** Declare it in
`frames/corrections.json` (`mirrorFrames`) — an edited `frame-N.svg` is wiped
by the next `--reingest`. Figures face RIGHT; where a strip disagrees with its
opposite-sex partner, the partner decides which frame is wrong. Do NOT flip
when the drawing is internally contradictory (a bend that goes the wrong way
for the stance): that is a redraw, recorded as a `redo` verdict.

## Both pipelines

- `npm run build` re-renders everything; **open `dist/sheet.html` and LOOK.**
- A rejected file is deleted and regenerated, never routed around.
- Poses (`poses/*.mjs`) are joint-angle data owned on this side — never edit.
