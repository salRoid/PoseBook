# The frame style contract — v1

**Style version: v1.** Every generated frame strip states this contract's
prefix verbatim. A paraphrased prefix is a changed style, and across ~700
strips the drift would be permanent — this file is parsed by `npm run brief`,
never restated (Foodsum's rule).

## Fixed prefix (v1)

Bold hand-drawn white outline illustration on a fully transparent background, single consistent line weight with slight sketch texture, anatomically defined musculature, no fill shading, no colour, no background, no text. One consistent visual system across every frame and every exercise.

## The two figures — fixed phrasing, never varied

- male: male figure, athletic build
- female: female figure, athletic build, hair in a simple bun

## Frame grammar

All frames of one movement are generated in ONE image, side by side, equal
square cells of 1024px. Within-movement consistency is guaranteed by the
single canvas; cross-movement consistency is carried by this prefix, the
figure phrasing, and the anchor protocol below.

## Hard exclusions

- colour of any kind — the ink is white, the background transparent
- fill shading, gradients, hatching beyond the light sketch texture
- faces with features, text, watermarks, borders
- any second person or object not named in the brief
- backgrounds of any kind, including floors — the ground line is the app's

## The anchor protocol

Generate `deadlift--m` FIRST and get it accepted. Every batch after that is
generated in the same session/style as the accepted anchor, and each batch's
first strip is compared against it before continuing. Consistency across 700
strips is maintained by never drifting from an accepted example, not by hoping.
