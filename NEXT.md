# PoseBook — open threads

**Extracted from `DECISIONS.md` on 2026-09-01.** Every item below was recorded
by a decision entry as **NOT DONE**, **NOT VERIFIED** or **NOT BUILT** and then
left inside a log nobody reads end to end. That is what this file fixes:
deferred work is only tracked if it sits somewhere you would actually look.

**These are quotes, not a triage.** Nothing here has been re-tested or
re-prioritised — some will already be done, some will be obsolete. Read the
entry named above each group in `DECISIONS.md` before acting, **delete the line
when it is finished**, and from now on record a deferral here *at the time you
defer it*, not only inside the decision entry.

Suite-wide open work stays in **`../NEXT.md`**.

---

### 2026-08-26 — Exercise/yoga art is OUR OWN rig (`PoseBook`), poses as data, not generated images

- **NOT verified:** nothing has rendered inside Health itself, and the
  everkinetic 560MB checkout still sits in a session scratchpad
  (`/private/tmp/...285a869e.../everkinetic`) — move it before it evaporates
  if re-imports matter.

### 2026-09-04 — A strip is cut on its INK, not on its width

- **NOT looked at by a human:** the 5 strips whose cut had no gutter to land
  in — `bicycle-crunch--m`, `dead-bug--f`, `nordic-curl--f`,
  `pigeon-stretch--f`, `sled-drag--m`. Component assignment gave each of them
  a clean split when checked at contact-sheet size, but a forced cut is where
  this can still go wrong, so they want a real look in the gallery.
- **NOT re-reviewed:** the whole corpus was re-sliced, so any frame reviewed
  before 2026-09-04 was reviewed against the OLD slicing. Verdicts recorded
  against a bled frame may now be stale in either direction.

### 2026-09-04 — A mirrored frame is repaired by FLIPPING it

- ~~Waiting on the generating agent: `laghu-vajrasana--m/f`, `box-jump--m`,
  `band-shoulder-dislocate--m`.~~ **DONE — all four verified correct
  2026-09-07** by rendering them: laghu-vajrasana arches the right way in both
  figures, box-jump has a real box across 3 frames, band-shoulder-dislocate is
  line art with a visible band, not a silhouette. Their `redo` verdicts in
  `frames/review.db` are stale; the db is no longer in git.
- **Known and deliberately NOT changed:** several strips are internally
  consistent but face LEFT, against the corpus convention, and so disagree with
  their opposite-sex partner — `astavakrasana--m`, `matsyasana--m`,
  `vasisthasana--f`, `bhujangasana--m`, `cable-woodchopper--m`, `sled-drag--f`,
  `single-arm-cable-pushdown--m`. Flipping a whole strip is a bigger call than
  fixing one odd frame out; it needs Sal's word first.

### 2026-09-07 — Published to GitHub, consumed by Health

- **`straight-arm-pulldown--m` is weak and NOT regenerated** — three
  near-identical frames with no visible bar. Found in the pre-publish sweep and
  shipped anyway (one movement in 350). Queue it.
- **Health's 64px card thumbnails render our line work FAINT.** The art it
  replaced was bold filled silhouettes; downsampling 512→64 dilutes thin
  strokes, worst on dense lying figures. The fix belongs HERE, not in Health —
  a mask cannot thicken a stroke, so it wants a dilated thumbnail variant out
  of `ingest-frames` (e.g. `frame-N@thumb.svg`) and a `thumb` field in
  `index.json`. Not designed, not built.
- **jsDelivr is a poor fit and Health should not depend on it.** Free, but its
  package cap is **150 MB** (its docs; its own API error string says 50) and
  our corpus is 130 MB. v1 at 175.9 MB was not indexed at all and served
  PARTIALLY — 9 of 24 sampled files real, 15 `Failed to fetch version info`,
  which is worse than a clean failure. Trimmed to 136 MB and re-tagged `v2`,
  still unindexed 5+ minutes on. Health's hosted path should bind-mount
  `/srv/lumen/PoseBook/frames/corpus` instead (see `../NEXT.md` §1h). **If a
  CDN is ever wanted, the ref form is `@2`, not `@v2`** — jsDelivr strips a
  leading `v`.
- **The corpus is 130 MB and that is the thing to shrink.** Every frame embeds
  an RGBA PNG averaging ~76 KB where the mask only ever reads shape.
  Re-encoding one sample: 55,792 bytes → **36,357** as a bare alpha channel,
  → 5,428 as a 2-colour palette (which would destroy anti-aliasing, so treat
  it as a ceiling, not a plan). A 35% cut is available losslessly and would
  also cut what Health fetches per figure, which is the same 76 KB — so this is
  the same fix as the faint-thumbnail item's sibling, not a separate chore.
  Needs a change to `ingest-frames`' SVG wrapper, and re-ingesting everything.
- **`scripts/export-health.mjs` is now DEAD.** It copied `dist/svg` into
  `Health/public/exercise-art`, which no longer exists — Health symlinks
  `frames/corpus` instead. It also exported the RIG's output, not the corpus.
  Delete it, or repoint it; do not run it.
- **The `--sex` follow-up in `README.md` is DONE** — Health picks m/f off the
  profile now. That README paragraph is stale.
