# PoseBook — decision log

## 2026-09-07 — The repo is published Foodsum-shaped: sources ignored, corpus served, manifest exported

**Decided (salroid: *"I want to fucking use it my app and all frames should
render MFs like foodsum"*).** PoseBook is pushed to `github.com/salRoid/PoseBook`
and tagged `v1`, and Health consumes it. "Like Foodsum" settled three questions
this repo had been answering differently.

**`.gitignore` follows Foodsum's, against this repo's own stated doctrine.**
The header here said *"Codex's sources are never ignored, in any state"* —
Foodsum ignores `inbox/*` and always has. Foodsum is right, and the reason now
applies here too: this repo is served to Health over a CDN, and
`frames/inbox/done` is **563 MB** of raw strips. A heavy repo is a slow clone
for every consumer, and the strips are reproducible — every one regenerates
from its own prompt via `npm run missing`. They are working files, not history.
Also newly ignored: `frames/backups` (123 MB of pre-re-ingest snapshots),
`dist/` (the RIG's output, which is **not** what Health reads), and
`review.db`/`reviews/` (a local SQLite surface every reviewer would conflict
on). 986 MB on disk becomes a 182 MB repo.

**Health SYMLINKS the corpus; nothing is copied.** `Health/public/posebook` ->
`PoseBook/frames/corpus`, exactly as `Health/public/foodsum` points at
Foodsum's images. So `npm run ingest-frames` is visible in the app immediately,
with no export step to forget — which retires `scripts/export-health.mjs` and
its whole no-clobber design (it existed to stop a half-replaced grid; there is
nothing left to half-replace).

**`npm run index` is new, and it is the one thing Foodsum's shape did not
already give us.** It writes `frames/corpus/index.json`, exported as
`@suite/posebook/index.json`, carrying the single fact a consumer cannot read
off a URL: **how many frames a movement has**. The corpus is not uniform — 468
figures at 3 frames, 80 at 2, 152 at 1, because a held asana has no rep to draw
— so a renderer assuming 3 would 404 on a quarter of it. Counted off DISK, not
off `meta.json`'s `frames`: meta records what the ingest INTENDED, and what a
browser can fetch is the truth. The manifest is ~20 KB and rides in Health's
bundle; the 1716 SVGs are 135 MB and are fetched at runtime.

### Reviewed by measurement before publishing, not by spot check

Coverage 2.0–23.7% of the canvas (no blank frames, no filled silhouettes),
every frame 512x512, every frame carries `currentColor`, and the 27 frames
touching a canvas edge are all equipment legitimately running off it — a cable
run, a heavy-bag chain. All 350 movements have both figures; the two apparent
gaps were `.DS_Store`.

**The four slugs `NEXT.md` still listed as awaiting regeneration are already
fixed** — `laghu-vajrasana` m/f arch correctly, `box-jump--m` has a real box,
`band-shoulder-dislocate--m` is line art with a visible band. Their `redo`
verdicts in `review.db` are stale, which is part of why that file is no longer
tracked.

**A trap worth recording, because it nearly produced a false "reviewed".** The
first contact sheets read the embedded PNG's ALPHA channel directly and looked
perfect — but Health renders these through a CSS mask, and the SVG wraps the
PNG in a **luminance** `<mask>` painting a `currentColor` rect. Those are not
the same operation, and a corpus that is fine in one can be invisible in the
other. A follow-up check rasterising the SVG at 128px then reported
`opaque: 0`, which read exactly like a broken mask; at the real 512 it is 255,
so THAT was a downsampling artifact rather than a bug. **Measure the pipeline
the consumer actually uses, at the size it actually uses** — the intermediate
result was misleading in both directions on the same file.

### Known and shipped anyway

`straight-arm-pulldown--m` is three near-identical frames with no visible bar.
One movement in 350; not worth holding a publish for, and it is in `NEXT.md`.

**jsDelivr is NOT proven.** Individual files serve (200, real bytes) but the
package API returns `403 Package size exceeded the configured limit of 50 MB` —
our corpus is 135 MB where Foodsum's is 31 MB, so we may be past what that CDN
will index even though it is currently serving. Health's LOCAL path does not
touch it and that is what was verified today. **Also: the ref is `@1`, not
`@v1`** — jsDelivr strips a leading `v`, verified by fetching both.

**The repo was PRIVATE when first pushed**, which is why jsDelivr 404'd
everything; salroid made it public mid-session. Worth knowing: a private repo
fails at the CDN with a 404 that looks exactly like a wrong path.

**Why PoseBook is the way it is.** Append-only, newest first: when a decision is
made, record it here *at the time*, with the reasoning and what was rejected.
A decision whose reason isn't written down gets re-litigated, or quietly undone
by whoever touches it next.

**Scope: PoseBook only.** Decisions that bind every app — the Core design system,
the page shape, the integration contract, analytics, deploy and security — live
in **`../DECISIONS.md`** and are referenced from here, never restated. If a
decision here disagrees with that file about something suite-wide, that file
wins.

> **⚠️ HISTORICAL RECORD — append-only. Entries are true AS OF THEIR DATE.**
>
> Entries written before **2026-08-27** describe the retired DigitalOcean
> droplet (`165.22.216.48`, PM2). The suite runs in Docker on the VPS
> `200.234.42.67` and deploys are `cd Lumen && ./deploy-vps.sh <App>`.
> **Never take infrastructure facts from this file** — take the reasoning; take
> the host, the deploy command and the runtime from `Lumen/DEPLOY.md`.

Format: what was decided · why · what was rejected · consequences.

---

## 2026-09-06 — Renamed Kinetic → PoseBook, because it is going open source

**Decided (Sal: "Let's go with PoseBook", after "It will be an open source repo
which could be used in Health also like foodsum").** The repo, the folder and
the package are now **PoseBook** / `@suite/posebook`. `Lumen/Kinetic` is
`Lumen/PoseBook`.

**Why rename at all.** Nothing depended on `@suite/kinetic` — no package.json
in the suite listed it — so the cost was ~70 string replacements and an hour.
The moment Health depends on it the same rename becomes a migration. A rename
is only cheap before the first consumer, and that consumer is next.

**Why not `Pose` or `Form`, which were the first instinct.** Both are taken on
npm, and worse, both are semantically occupied. `pose` reads as pose
*estimation* — OpenPose, PoseNet, MediaPipe — an ML field this is not, plus
Popmotion's Pose animation library. `form` is owned outright by web forms,
with lifting-technique "form" a distant second. For a private `@suite/*`
package neither would have mattered; for a public repo people are meant to
FIND, the name is the discoverability. Checked against the registry rather
than assumed: `pose`, `form`, `gesture`, `contour`, `motif` and `posture` all
return 200; `posebook`, `posekit`, `formline` and `poselib` are free.

**`Gesture` was recommended and then withdrawn** — it is the right art term
for a figure drawn in motion, and it pairs with Anatomy (structure) the way
the two actually differ, but touch/swipe gesture libraries own the word on
npm. It was a good private name and a bad public one. `Formline` was the
runner-up and remains a reasonable second: it carries a real double meaning
(form as technique, line as the contour linework STYLE.md mandates) but leans
strength-ward where PoseBook leans slightly yoga-ward.

**What was deliberately NOT renamed, and why.**
- **`everkinetic` is untouched, all 350 occurrences.** It is a third-party
  project name that merely contains our old one. Every replacement in this
  change is guarded by a `(?<!ever)` lookbehind, and the corruption check
  (`everposebook`) returns zero. A blind case-insensitive replace here would
  have silently rewritten the attribution for the entire CC BY-SA corpus.
- **Historical entries in this file keep "Kinetic".** The log is append-only
  and entries are true as of their date; the 2026-08-26 entry describes a
  project that WAS called Kinetic. Only the file's own header and scope lines,
  which are present-tense structure, were changed.
- **`/tmp/kinetic-*.json` paths inside older entries.** Those strings are
  recorded verbatim as `source` values in `frames/review.db`; rewriting the
  prose would make it stop matching the data.
- **The gallery's `kinetic.*` localStorage keys were renamed, WITH a
  fallback.** `load()` reads the old key when the new one is empty and the
  next `save()` writes it forward. A reviewer was mid-session when this
  landed (`scripts/serve.mjs` was running and took 82 reviews during it) and a
  rename that silently orphans in-progress drafts loses real work.
  `review.mjs` / `import-review.mjs` fall back to `~/Downloads/kinetic-review.json`
  for the same reason.

**Consequences.** `frames/review.db` was NOT touched (integrity_check ok, 191
rows, zero `posebook` strings in it) — it was in the match list only because
old `/tmp/kinetic-*` source paths are stored inside it, and rewriting a binary
SQLite file with a text substitution would have destroyed it. A running
`serve.mjs` keeps working across the directory rename because its cwd follows
the inode, but a restart needs the new path.

---

## 2026-09-04 — A mirrored frame is repaired by FLIPPING it, recorded in `frames/corrections.json`

**Decided (Sal, over a run of reports: "Inverted Row one frame is in opposite
direction", then Dragon Flag, Decline Dumbbell Press, Wheel Pose, Tiger Pose,
Ear-Pressing Pose).** When one frame of a strip was drawn facing the opposite
way to its siblings, the repair is a horizontal flip of that frame, declared in
**`frames/corrections.json`** (`{"<slug>--<sex>": {"mirrorFrames": [n], "why":
"…"}}`) and applied by `ingest-frames` after the cut.

**Why a declared correction and not an edited SVG.** The corpus is re-sliced
wholesale (`--reingest`), so a hand-edited `frame-2.svg` is silently destroyed
by the next run — the fix has to live somewhere the pipeline READS. It is kept
out of `frames/review.db` deliberately: a review is a judgement about art, this
is an instruction to the splitter. `meta.json` records `mirroredFrames` so a
flipped frame is never a mystery.

**Why flipping is legitimate here.** These are side-on figures of symmetric
movements: a flip changes which limb is nearer the viewer and nothing else. It
is NOT legitimate where the drawing is internally contradictory — see below —
or for a genuinely one-sided movement, and the file's header says so.

**The corpus convention is that figures face RIGHT**, and where a strip
disagreed with its opposite-sex partner the partner settled which frame was
wrong (`urdhva-dhanurasana--m` frame 1, `vyaghrasana--f` frame 1,
`sirsasana--f` frame 1 were all decided this way).

**A silhouette-IoU detector was built and REJECTED as the primary method.**
Comparing each frame against its siblings direct-vs-mirrored ranks the true
defects highly (it found Wheel Pose and Tiger Pose before Sal named them) but
it both false-positives on movements that really are side-to-side (windshield
wiper, cossack squat) and, fatally, MISSES real ones — `laghu-vajrasana` scores
*negative*. So the whole corpus was swept visually instead: all 368 multi-frame
strips, eight parallel agents, each judging facing per frame against the
right-facing convention. 10 strips flipped; `thoracic-rotation--m` was found by
the sweep and not by Sal.

**What a flip cannot fix, and was sent back for redraw instead.**
`laghu-vajrasana--m` and `--f` frame 2 arch the wrong way relative to the
kneel: as drawn the shins say "facing right" while the head has come down in
FRONT of the knees, and mirroring only trades one contradiction for the other.
Also `box-jump--m` and `band-shoulder-dislocate--m`, which render as solid
black silhouettes with no line work. All four are recorded as `redo` verdicts
in `frames/review.db` (source `facing-sweep-2026-09-04`) so the next brief
carries the correction to the generating agent.

---

## 2026-09-04 — The gallery's save button tries an ABSOLUTE localhost endpoint before it gives up and downloads

**Decided (Sal: "when I save review it still downloads the json file why").**
The gallery now POSTs to `/api/review` and then to
`http://localhost:5391/api/review` before falling back to a download, and
`serve.mjs` answers CORS preflight so that second attempt can succeed. The
fallback's button text says what happened and what to run instead of the
silent "downloaded (no server running)".

**Why.** The download was not a bug — it was the fallback firing correctly for
an invisible reason. `dist/gallery.html` and `reviews/gallery.html` are
routinely opened as FILES (double-clicked, or sent to another device), and a
`file://` page's same-origin POST to `/api/review` can never reach a server on
localhost. So the page looked identical whether or not `npm run serve` was
running, and the honest cause — no server, or the wrong origin — was never on
screen. The port is read from `process.env.PORT` in both scripts, and
`serve.mjs` regenerates the gallery in a child process, so a custom port stays
consistent between the two.

**Also fixed in the same pass: the page took 66s to open.** `serve.mjs`
rebuilt the whole gallery on every GET — ~30s, because each of the 509
movements' frames is decoded and inlined — which to a browser is
indistinguishable from a page that never loads ("the page is not opening").
It now rebuilds only when its inputs changed (newest mtime under
`frames/corpus`, or `frames/review.db`) and otherwise serves the built file:
0.2s. A save rebuilds inside the POST handler, so the reload after a review is
instant too, and `/?fresh` forces a build. **Rejected:** streaming or paging
the 12MB page — the whole point of the contact sheet is seeing everything at
once, and the cost was never the size, it was rebuilding it needlessly.

**Consequences.** Opened as a file with the server running, a save now lands in
`frames/review.db` directly. With no server it still downloads, but says so.
`Access-Control-Allow-Origin: *` is safe here because the server binds
`127.0.0.1` only. A gallery opened on a **different device** still downloads —
localhost is that device's own machine — and that is not solved.

---

## 2026-09-04 — A strip is cut on its INK, not on its width, and no ink is ever sliced

**Decided (Sal: "in some of the video frames you don't cut properly so hands
from left / right or elements also show in other frame").** `ingest-frames`
no longer splits a strip into N equal columns. It now, per strip: builds a
column ink profile → erases DRAWN divider lines (a narrow near-full-height
run sitting near a nominal boundary) → puts each cut in the middle of a real
GUTTER, choosing the widest empty run nearest each nominal boundary → labels
the strip's ink into connected components and gives each component WHOLE to
the frame its centre of mass falls in → composes every frame onto one shared
canvas size, centred on its own ink.

**Why.** Codex draws each figure freehand inside its own third, and the
figures are not the same width: measured over the 509 archived strips, **81
had ink crossing the arithmetic boundary**. An equal-width split therefore
amputated one figure and left the amputated piece hanging in its neighbour —
a stray foot in frame 2 of `ab-wheel-rollout`, 220px of the cable machine
from frame 2 standing in frame 1 of `high-row-machine`. **12 strips** also
carried a drawn separator line, baked into every frame as an edge rule.

**Why components and not just a better cut.** A moved cut fixes 76 of the 81.
The rest (e.g. `dead-bug--f`) genuinely overlap: the lying figure's extended
leg reaches past any gutter, so *every* vertical knife either cuts the leg
off or leaves a floating shoe next door. Assigning whole components removes
the knife from the problem — the leg travels with its own figure. **Rejected:
pruning the fragments** after cutting (tried first; it deletes the shoe but
frame 1 still ends in a severed shin, and the size threshold that spares a
dumbbell also spares a shoe).

**Why one shared canvas per strip.** Cuts now land at different widths, and
`fit: contain` would then scale each frame differently — the figure growing
and shrinking as the frames ping-pong. One canvas width for the whole strip
makes the scale identical by construction. Per-frame horizontal centring (the
"re-centre each frame on its own ink bbox" fix, commit `dbf8ecc`) is kept and
now runs off the component bounds instead of a raw cell bbox.

**Consequences.** `--reingest` re-sliced all 509 archived strips: 0 rejected,
0 components spanning frames, 5 strips needed a forced (gutterless) cut and
are named in the run output, 12 dividers erased. `meta.json` now records
`cutsPx` vs `nominalCutsPx`, `forcedCuts`, `dividersErased`, `canvasWidthPx`
and `reclaimedInkPx`, so a bad frame can be traced to its cut without
re-deriving anything. **No art was regenerated and no alpha math changed** —
this was a filing bug, which is exactly what `--reingest` exists for (see
`AGENTS.md`: never `--reingest` to fix ART).

---

## 2026-08-26 — Exercise/yoga art is OUR OWN rig (`Kinetic`), poses as data, not generated images

**Decided (Sal: "Let's build our own now… For Yoga and Workout both. Men and
Women both").** `Lumen/Kinetic` (`@suite/kinetic`, zero deps): a parameterised
figure, forward kinematics over absolute joint angles, side + front
projections, male and female bodies, props anchored to joints, multi-frame SVG
out in Health's exact `exercise-art/<slug>/frame-N.svg` shape (512×512,
`currentColor`, mask-compatible). v0 ships 9 workout movements + 7 asanas ×
both sexes = 50 frames, every one rendered to PNG and LOOKED AT before being
called done; `dist/sheet.html` is the standing contact sheet.

**Why a rig and not generation.** `Health/ATTRIBUTION.md`'s 15 rejected
illustrations are the evidence: image models cannot hold one figure across
frames, and a movement IS one figure in several positions. A rig makes
consistency structural, multi-frame free (cat–cow is 2 data entries), both
sexes automatic, and a wrong pose a wrong number. **Rejected:** generate +
vectorise (frame consistency unsolved, path soup); posing `anatomy.glb`
(checked: no skins/joints/animations — it is a static trimesh atlas).
**Superseded:** the same-day "okay to use everkinetic" call — everkinetic
stays for what it already covers until Sal chooses per-slug replacement.

**Consequences.** `npm run export` copies into Health but SKIPS slugs with
existing art unless `--force` — replacing a visual language is a per-run
deliberate act, and mixing two styles in one grid is the known failure. Yoga
art is NOT yet visible in Health: `exerciseArtSlug()` returns null for asanas,
so the id→slug mapping (and per-user m/f selection off the profile's `sex`
field) is the remaining Health-side wiring. **NOT verified:** nothing has
rendered inside Health itself, and the everkinetic 560MB checkout still sits
in a session scratchpad (`/private/tmp/...285a869e.../everkinetic`) — move it
before it evaporates if re-imports matter.

---
