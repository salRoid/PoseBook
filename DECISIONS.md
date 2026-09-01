# Kinetic — decision log

**Why Kinetic is the way it is.** Append-only, newest first: when a decision is
made, record it here *at the time*, with the reasoning and what was rejected.
A decision whose reason isn't written down gets re-litigated, or quietly undone
by whoever touches it next.

**Scope: Kinetic only.** Decisions that bind every app — the Core design system,
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
