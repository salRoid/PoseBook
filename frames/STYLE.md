# The frame style contract — v1

**Style version: v1.** Every generated frame strip states this contract's
prefix verbatim. A paraphrased prefix is a changed style, and across ~700
strips the drift would be permanent — this file is parsed by `npm run brief`,
never restated (Foodsum's rule).

## Fixed prefix (v1)

Bold hand-drawn white contour illustration on a uniform solid black background, with dense realistic anatomical and equipment definition built from layered weathered strokes. Use consistent medium line weight and fine interior muscle, clothing, and equipment detail. Keep every region between the narrow strokes open so the uniform black background remains visible through the figure. Use white linework only, with no shading, scenery, or text. One consistent visual system across every frame and every exercise.

## The two figures — fixed phrasing, never varied

- male: male figure, athletic build
- female: female figure, athletic build, hair in a simple bun

## User-approved catalogue pattern — mandatory visual references

This is the approved pattern to preserve for every future strip. It clarifies
style v1; it does not restyle the accepted catalogue.

- primary rendering reference for both sexes:
  `frames/inbox/done/close-grip-dumbbell-press--m.png`
- female proportion, clothing, and hair reference:
  `frames/inbox/done/dumbbell-clean-and-press--f.png`

The primary reference controls stroke density, realistic musculature,
equipment detail, weathered hand-drawn character, and the balance between
white ink and transparent interior. The female reference controls only the
female figure phrasing—athletic proportions, workout clothing, and simple
bun—while using the same rendering treatment as the primary reference.

Before saving any generated strip, compare a dark-background composite with
both references. Reject simplified vector-like outlines, pale/white flooded
bodies, sparse anatomy, smooth cartoon strokes, or a different rendering
system even when the pose itself is correct.

## Frame grammar

All frames of one movement are generated in ONE image, side by side, equal
square cells of 1024px. Within-movement consistency is guaranteed by the
single canvas; cross-movement consistency is carried by this prefix, the
figure phrasing, and the anchor protocol below.

## Hard exclusions

**These are TRANSMITTED, not just documented.** `npm run brief` parses this
list and appends it to every prompt. That was not always true: for the first
131 strips only the fixed prefix was sent, and this section sat here unread
by anything — which is why "no borders" and "no background" were in the
contract while the corpus filled up with border boxes and checkerboards. If
you add a rule here, it ships. Keep every bullet phrased as an instruction a
model can obey.

- use white linework on a uniform solid black background
- solid fill shading or gradients — dense anatomical/detail hatching is
  allowed only as narrow weathered strokes separated by transparent interior
- faces with features, text, watermarks
- any second person or object not named in the brief
- keep the background uniformly black with no floors or scenery — the ground
  line is the app's
- **open contour construction.** Draw only narrow contour and interior
  definition strokes; every region between strokes must remain uniform black.
- **continuous canvas.** Separate sequential poses only with uninterrupted
  uniform black space, and keep the full outer edge uniformly black.
- **complete figures with clear margins.** Keep every figure, limb, hand,
  foot, and implement wholly inside its allotted square region with clear
  space on all four sides.

## The anchor protocol

Generate `deadlift--m` FIRST and get it accepted. Every batch after that is
generated in the same session/style as the accepted anchor, and each batch's
first strip is compared against it before continuing. Consistency across 700
strips is maintained by never drifting from an accepted example, not by hoping.
