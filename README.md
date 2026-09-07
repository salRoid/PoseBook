# PoseBook

**Our own exercise and yoga figures.** A parameterised body, poses as
joint-angle data, multi-frame SVG out — for both disciplines, both sexes,
owned outright: no CC BY-SA obligations, no coverage ceiling, no style drift.

```bash
npm run build              # poses → dist/svg/<slug>/<m|f>/frame-N.svg + dist/sheet.html
npm run build squat        # rebuild one slug while tuning its pose
npm run export             # → Health/public/exercise-art/ (skips existing slugs)
npm run export -- --sex f  # ship the female figure
npm run export -- --force  # replace slugs that already have (everkinetic) art
```

## Why a rig, not generated images

`Health/ATTRIBUTION.md` records 15 illustrations rejected after being rendered
and looked at — sit-up drawn as a crunch, suitcase-carry as farmer-carry. A
movement is the same figure in several positions, which is exactly what image
models cannot hold. Here it is structural: one body, so frames cannot
disagree, a wrong pose is a wrong **number**, and a new exercise is ~5 lines
of data in `poses/`. Multi-frame is free — cat–cow is 2 frames, a surya
namaskar sequence is just more entries in `frames`.

## The Codex loop — real bodies from body PARTS

The stick figure is the skeleton; a library of body-part silhouettes is its
skin. Each part is generated **once** and reused in every frame of every
exercise, so there is no frame-to-frame consistency to lose — the thing that
sank generated whole-pose art. `AGENTS.md` is what the generating agent reads;
`parts/spec.mjs` is the single source for the 20 parts, their canvases,
anchors and prompts.

```bash
npm run missing        # the 20-part queue, each with its exact prompt
#   …generate → parts/inbox/<part>--<m|f>.png…
npm run ingest         # validate → trace to vector (pure JS) → anchor → manifest
npm run build          # every exercise re-renders with the new bodies
```

A part missing from the manifest falls back to stroke rendering, so the
library fills in any order and a bad part is deleted, not routed around.
`scripts/dev-fake-parts.mjs` writes synthetic capsule parts to prove the
pipeline without generating anything — the whole chain (trace → anchor →
per-bone matrix → assembly) is verified end to end with it.

## Authoring a pose

Angles are **absolute degrees**: `0` = the direction the figure faces (+x),
`90` = up, `-90` = down. Side view uses `armNear`/`armFar` (`[upper, fore]`)
and `legNear`/`legFar` (`[thigh, shin, foot]`); far defaults to near and draws
at 35% opacity. Front view uses `armL/armR/legL/legR`. `bend` arches the spine
(cat +, cow −). Props (`barbell`, `dumbbell`, `barbell-front`, `bench`) anchor
to solved joints and move with the pose.

Tune loop: edit the numbers → `npm run build <slug>` → open `dist/sheet.html`.
**Look at every frame before exporting** — same rule as Foodsum's corpus.

## The two figures

`m` and `f` differ in proportions (shoulder/hip width, stroke weight) and the
`f` figure's bun — every pose renders as both automatically. Health ships one
per slug today because `ExerciseFigure` reads `<slug>/frame-N.svg` with no
body selection; the profile already carries `sex`, so teaching the renderer to
pick `m|f` is the natural Health-side follow-up, and `export` re-runs in one
command when it lands.

## Output contract

512×512 viewBox (the everkinetic canvas), `currentColor` ink — works
standalone and through Health's CSS mask (alpha is what the mask reads). All
frames of one exercise share one transform and one ground line, so the figure
never resizes or floats mid-movement.

**`currentColor` is not optional, and it applies to BOTH pipelines.** The rig
fills its paths with `currentColor` directly. The frames corpus embeds a PNG,
so it cannot — instead the PNG is used as a `<mask>` and what renders is a
`currentColor` rect showing through it. Same result: the ink is whatever CSS
`color` the host sets, so one corpus reads on a white screen and a black one
and light/dark mode is a colour change, not a second set of files.

Until 2026-08-29 the frames corpus painted the PNG directly, baking WHITE
pixels — invisible on a light background, and unthemeable. The gallery hid
this because it was hard-coded dark. If you ever see a frame SVG without
`currentColor` in it, the ingest wrapper has regressed; `npm run gallery`'s
light/dark toggle is the check.

## Catalogue (v0)

Workout (side unless noted): squat · push-up · deadlift · plank · lunge ·
overhead-press (front) · biceps-curl · bench-press · crunch.
Yoga: tadasana (front) · downward-dog · warrior-2 (front) · tree-pose (front) ·
child's-pose · cobra · cat-cow (2-frame).

Slugs are asset addresses, not Health catalogue ids — yoga ids there are
`yoga-`-prefixed and `exerciseArtSlug()` maps id → art. Wiring the yoga
mapping is the remaining Health-side step.
