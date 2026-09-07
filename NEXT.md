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

- **Waiting on the generating agent:** `laghu-vajrasana--m`, `laghu-vajrasana--f`
  (frame 2 arches the wrong way — a flip cannot fix it), `box-jump--m` and
  `band-shoulder-dislocate--m` (solid black silhouettes, wrong style). All four
  carry `redo` verdicts in `frames/review.db`; delete this line when they are
  regenerated and re-ingested.
- **Known and deliberately NOT changed:** several strips are internally
  consistent but face LEFT, against the corpus convention, and so disagree with
  their opposite-sex partner — `astavakrasana--m`, `matsyasana--m`,
  `vasisthasana--f`, `bhujangasana--m`, `cable-woodchopper--m`, `sled-drag--f`,
  `single-arm-cable-pushdown--m`. Flipping a whole strip is a bigger call than
  fixing one odd frame out; it needs Sal's word first.
