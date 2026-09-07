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
- **jsDelivr has not been proven for this repo.** Individual files serve, but
  `data.jsdelivr.com` returns `403 Package size exceeded the configured limit
  of 50 MB` for the package listing — our corpus is 135 MB, Foodsum's is 31 MB.
  Health's hosted build depends on this working; check it properly before
  bumping `NEXT_PUBLIC_POSEBOOK_BASE` anywhere real. **The ref form is `@1`,
  not `@v1`** — jsDelivr strips a leading `v` and `@v1` 404s.
- **`scripts/export-health.mjs` is now DEAD.** It copied `dist/svg` into
  `Health/public/exercise-art`, which no longer exists — Health symlinks
  `frames/corpus` instead. It also exported the RIG's output, not the corpus.
  Delete it, or repoint it; do not run it.
- **The `--sex` follow-up in `README.md` is DONE** — Health picks m/f off the
  profile now. That README paragraph is stale.
