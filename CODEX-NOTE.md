# Note for Codex — PoseBook regeneration queue

**Written 2026-09-06.** Everything below is derived from `frames/review.db` and
what is actually on disk, not from memory. Re-derive it any time with
`npm run status` and `npm run brief`.

## 0 · The repo was renamed. Kinetic is now PoseBook.

`Lumen/Kinetic` → **`Lumen/PoseBook`**, package `@suite/kinetic` →
**`@suite/posebook`**. Nothing else moved: `frames/inbox/`, `frames/corpus/`,
`frames/STYLE.md`, `poses/PLAN.json` are all where they were. Script log lines
now say `posebook:`.

**`everkinetic` is NOT this project** — it is the third-party CC BY-SA source,
and its name merely contains the old one. Do not "fix" it to `everposebook`
anywhere; all 350 references in `poses/PLAN.json` are correct as they stand.

## 1 · What to do

```bash
npm run brief                    # dist/briefs.json — 700 records, prompts pre-assembled
#   …generate each brief's strip, save EXACTLY as brief.file → frames/inbox/…
npm run ingest-frames            # cell grammar → background → split → corpus
npm run status                   # confirm the count moved
```

**56 of those briefs already carry the rejection note as a CORRECTION line** —
`npm run brief` reads `frames/review.db` and folds the reviewer's own words
into the prompt. Use the brief text verbatim. Do not paraphrase the style
prefix: it is parsed from `frames/STYLE.md`, versioned `v1`, and a reworded
prefix across ~700 strips is permanent drift.

## 2 · Current state

| | |
|---|---|
| Figures done | **653 / 700** (93.3%) |
| Still to generate | **47** (deleted on rejection) |
| Rejected but STILL ON DISK | **9** (delete, then regenerate) |
| Total outstanding | **56** |
| Movements missing one sex | 39 (29 no `m`, 18 no `f`; 8 missing both) |

Every deletion is accounted for by a `redo` verdict — nothing vanished
unexplained.

## 3 · The defect themes, most common first

These are the reviewer's own notes, grouped. **21 of 56 are the same defect.**

### 21 × "the body has gone too white" / "completely white"
The single biggest failure and the one to fix first. The figure is being
filled or flooded with white instead of being **drawn**. `frames/STYLE.md`
requires: narrow contour strokes with **the dark background visible through
every region between them**. A figure that reads as a white silhouette — or a
white blob with a few dark cracks — is a reject even when the pose is right.
Interior muscle/clothing/equipment definition must stay as separate strokes.

### 13 × "Missing Face eyes and all"
The head is being drawn as a blank oval. Faces need eyes and features in the
same narrow-contour idiom as the body, consistent across every strip.

### 7 × wrong pose or wrong frame
Named individually below — these need the pose read, not the style fixed.

### 3 × clothing
Two are "make her wear tank top and shorts", one is "where are the man's
shorts". The figures must be clothed consistently across the corpus.

### 2 × pixelated background
The background is coming out as a compressed/checkerboard artefact rather than
a clean uniform dark field. Regenerate at full quality; do not post-process.

### Also
"white border box" (`navasana--f`), "extra white inside"
(`close-grip-dumbbell-press--m`), "doesn't look like a female"
(`russian-twist--f`), "girl doesn't look same as our others"
(`rowing-machine--m`).

## 4 · Delete these 9 first — the rejected file is still on disk

A rejected file is **deleted and regenerated, never edited around**.

| figure | why it was rejected |
|---|---|
| `balasana--f` | Why is this completely white, doesn't match the pattern |
| `balasana--m` | Why is this completely white, doesn't match the pattern |
| `bhujangasana--m` | Pixelated background man |
| `close-grip-dumbbell-press--m` | There is extra white inside this please fix it. |
| `dumbbell-snatch--m` | This has pixelated background |
| `gomukhasana--f` | Why is this completely white, doesn't match the pattern |
| `navasana--f` | Why is there a white border box |
| `siddhasana--f` | The figure was not constructed solely from narrow contour and interior definition strokes with open dark regions between every stroke. |
| `ustrasana--m` | The body has gone too white fix it |

## 5 · The 47 already deleted — regenerate

Tier order is the work order: tier 2 (asanas) before 3 before 4.

### Tier 2 — asanas (10)
| figure | why it was rejected |
|---|---|
| `akarna-dhanurasana--f` | Why is this completely white, doesn't match the pattern |
| `anantasana--m` | Why is this completely white, doesn't match the pattern |
| `durvasasana--m` | Pixletated Background |
| `garudasana--m` | Where are the mans shorts |
| `karnapidasana--f` | The full expression did not bend both knees down to the floor beside the ears; it remained a straight-leg Plough Pose. |
| `kraunchasana--f` | Show Heron Pose seated on the floor in strict side profile: one sitting bone grounded, one knee flexed with that shin folded backward beside the hip, and the opposite leg held straight upward toward the face with both hands holding the raised foot. |
| `laghu-vajrasana--f` | Same defect as laghu-vajrasana--m: frame 2 arches the wrong way relative to the kneel, and cannot be repaired by mirroring. Redraw frame 2 as a back-bend with the crown behind the feet, facing right like frame 1. |
| `laghu-vajrasana--m` | Frame 2 is internally contradictory, and a horizontal flip cannot fix it: the kneel (shins/feet to the left) says the figure faces right, but the head has come down to the RIGHT of the knees, i.e. arched FORWARD. Laghu vajrasana arches BACK — the crown lands behind the feet. Redraw frame 2 as a true back-bend, head and feet on the same side, facing right like frame 1. |
| `parsvottanasana--f` | Use a true front view with the face aligned consistently with the male version. Show a short staggered stance, both legs straight, hips squared, and the torso folding lengthwise over the straight front leg; do not show a wide straddle or lateral side bend. |
| `parsvottanasana--m` | Use a true front view with the face aligned consistently with the female version. Show a short staggered stance, both legs straight, hips squared, and the torso folding lengthwise over the straight front leg; do not show a wide straddle or lateral side bend. |

### Tier 3 (6)
| figure | why it was rejected |
|---|---|
| `band-shoulder-dislocate--m` | The body has gone too white fix it |
| `barbell-high-pull--m` | The body has gone too white fix it |
| `box-jump--m` | The body has gone too white fix it |
| `clean-pull--f` | (no note) |
| `stationary-bike-intervals--m` | The body has gone too white fix it |
| `thruster--m` | The body has gone too white fix it |

### Tier 4 (31)
| figure | why it was rejected |
|---|---|
| `assisted-pull-up--f` | Make her wear tank top and shorts |
| `assisted-pull-up--m` | The body back has gone too white fix it |
| `back-extension--f` | Make her wear tank top and shorts |
| `back-squat--m` | The body has gone too white fix it |
| `band-pull-apart--m` | The body has gone too white fix it |
| `barbell-bench-press--m` | The body has gone too white fix it |
| `barbell-curl--m` | The body has gone too white fix it |
| `barbell-shrug--f` | The body has gone too white fix it |
| `barbell-shrug--m` | The body has gone too white fix it |
| `burpee--f` | The angle issue here |
| `burpee--m` | The angle issue here |
| `cable-pull-through--f` | Some issues with design |
| `chin-up--f` | Missing Face eyes and all |
| `decline-dumbbell-press--f` | Second Frame not proper |
| `handstand-push-up--m` | One frame is on wrong direction |
| `hip-thrust--f` | The body has gone too white fix it |
| `hip-thrust--m` | The body has gone too white fix it |
| `jm-press--m` | Hand Position is going wrong |
| `lat-pulldown--m` | Second Frame not proper |
| `machine-lateral-raise--f` | Missing Face eyes and all |
| `machine-lateral-raise--m` | Missing Face eyes and all |
| `neutral-grip-pull-up--m` | Missing Face eyes and all |
| `neutral-grip-pulldown--m` | Missing Face eyes and all |
| `pull-up--f` | Missing Face eyes and all |
| `pull-up--m` | Missing Face eyes and all |
| `rowing-machine--m` | Girl doesn't look same as our others |
| `russian-twist--f` | Doesn't look like a female |
| `seated-leg-curl--f` | The legs on frame 2 is wrong |
| `skull-crusher--m` | The legs on frame 2 is wrong, it's double legs |
| `sumo-deadlift--m` | Missing Face eyes and all |
| `upright-row--m` | Missing Face eyes and all |

## 6 · The rules that keep costing us frames

1. **The ink is `currentColor`, never white.** Frame SVGs paint a
   `currentColor` rect through a mask made from the PNG. White pixels are
   invisible on a light screen and cannot follow light/dark mode.
2. **Never fix art by changing the alpha math**, and never `--reingest` to fix
   ART. A baked-in matte or checkerboard is a GENERATION defect in that file —
   regenerate it. Reprocessing the whole corpus to work around a handful of bad
   inputs destroyed anti-aliasing corpus-wide once already.
3. **The cut comes from the INK, never `width / N`.** Do not slice a component
   to make a frame fit.
4. **A frame facing the wrong way is FLIPPED, not hand-edited** — declare it in
   `frames/corrections.json` (`mirrorFrames`). An edited `frame-N.svg` is wiped
   by the next `--reingest`. Figures face RIGHT. But do NOT flip when the
   drawing is internally contradictory (see `laghu-vajrasana` below) — that is
   a redraw.
5. **Background transparent.** Dark is tolerated and keyed; opaque white is
   rejected, because the ink is white.
6. **All frames of one movement in ONE image**, equal square cells side by
   side, per the brief's frame line. That is what holds a movement together.
7. **Never generate from everkinetic / Bryl Lim images** — img2img, edits or
   tracing inherit CC BY-SA and defeat the entire ownership goal. Style comes
   from the contract text only.

## 7 · Two that need a real redraw, not a restyle

`laghu-vajrasana--m` and `--f`, frame 2: as drawn, the kneel (shins and feet to
the left) says the figure faces right, but the head has come down to the RIGHT
of the knees — arched FORWARD. Laghu vajrasana arches **BACK**: the crown lands
behind the feet, head and feet on the same side. Mirroring only trades one
contradiction for the other. Redraw frame 2 as a true back-bend, facing right
like frame 1.
