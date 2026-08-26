// The Kinetic engine — a figure is a RIG, a pose is DATA, a movement is frames.
//
// ── WHY A RIG AND NOT GENERATED PICTURES ──
// Health's own record settles this: `ATTRIBUTION.md` lists 15 generated/matched
// exercise illustrations rejected after being looked at (sit-up drawn as a
// crunch, suitcase-carry as farmer-carry), because image models cannot hold the
// SAME figure across frames — and a movement is by definition the same figure
// in several positions. Here consistency is structural: every frame of every
// exercise is literally one parameterised body, so it cannot drift. A wrong
// pose is a wrong NUMBER, fixed by editing a joint angle, not by regenerating
// and re-reviewing.
//
// ── THE MODEL ──
// Forward kinematics over a stick skeleton, two projections:
//   side  — near/far limb pairs; the far pair renders at reduced opacity.
//   front — L/R limb pairs; shoulder and hip WIDTH exist only here, which is
//           also where the male/female difference is most visible.
// Angles are ABSOLUTE degrees: 0 = forward (+x, the figure faces right in side
// view), 90 = up, -90 = down. Authoring against world space, not parent-
// relative, is what makes a pose legible enough to fix by reading it.
//
// ── OUTPUT CONTRACT ──
// SVG in a 512×512 viewBox — the same canvas the everkinetic import used — in
// `currentColor`, so the file works standalone AND through Health's
// `ExerciseFigure` CSS mask (the mask reads alpha; the ink colour comes from a
// Lumen token at render time). All frames of one exercise share ONE transform,
// so the figure never changes size between frames of a movement.
// `opts.palette` switches to real colours — see renderExercise.

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// The body-part library (parts/manifest.json, written by `npm run ingest`).
// Optional by design: a bone whose part is absent renders as the stroke
// fallback, so the library can be filled in any order — Foodsum's rule that
// absence degrades and never breaks.
let MANIFEST = {};
try {
  MANIFEST = JSON.parse(readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', 'parts', 'manifest.json'), 'utf8'));
} catch { /* no parts yet — stroke rendering throughout */ }

const RAD = Math.PI / 180;
export const dir = (a) => [Math.cos(a * RAD), -Math.sin(a * RAD)];
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];

// ── the two bodies ──────────────────────────────────────────────────────────
export const FIGURES = {
  m: {
    headR: 29, neck: 20, torso: 132, upper: 70, fore: 66,
    thigh: 106, shin: 101, foot: 34, shoulderW: 100, hipW: 56,
    w: { torso: 33, upper: 20, fore: 17, thigh: 22, shin: 18, foot: 13, neckW: 15 },
    hair: null,
  },
  f: {
    headR: 28, neck: 19, torso: 128, upper: 66, fore: 62,
    thigh: 104, shin: 99, foot: 31, shoulderW: 82, hipW: 74,
    w: { torso: 28, upper: 17, fore: 14.5, thigh: 19.5, shin: 16, foot: 12, neckW: 13 },
    hair: 'bun',
  },
};

// ── kinematics ──────────────────────────────────────────────────────────────
function limbArm(F, from, [ua, fa]) {
  const elbow = add(from, dir(ua), F.upper);
  return { shoulder: from, elbow, wrist: add(elbow, dir(fa), F.fore) };
}
function limbLeg(F, from, [th, sh, ft]) {
  const knee = add(from, dir(th), F.thigh);
  const ankle = add(knee, dir(sh), F.shin);
  return { hip: from, knee, ankle, toe: add(ankle, dir(ft), F.foot) };
}

export function solve(F, frame, view) {
  const pelvis = [0, 0];
  const torsoA = frame.torso ?? 90;
  const chest = add(pelvis, dir(torsoA), F.torso);
  const neckA = frame.neck ?? torsoA;
  const headC = add(chest, dir(neckA), F.neck + F.headR);

  const j = { pelvis, chest, headC, torsoA, neckA, bend: frame.bend ?? 0 };

  if (view === 'side') {
    j.armNear = limbArm(F, chest, frame.armNear);
    j.armFar = limbArm(F, chest, frame.armFar ?? frame.armNear);
    j.legNear = limbLeg(F, pelvis, frame.legNear);
    j.legFar = limbLeg(F, pelvis, frame.legFar ?? frame.legNear);
  } else {
    const sL = add(chest, [-F.shoulderW / 2, 0]);
    const sR = add(chest, [F.shoulderW / 2, 0]);
    const hL = add(pelvis, [-F.hipW / 2, 0]);
    const hR = add(pelvis, [F.hipW / 2, 0]);
    j.sL = sL; j.sR = sR; j.hL = hL; j.hR = hR;
    j.armL = limbArm(F, sL, frame.armL);
    j.armR = limbArm(F, sR, frame.armR);
    j.legL = limbLeg(F, hL, frame.legL);
    j.legR = limbLeg(F, hR, frame.legR);
  }
  return j;
}

// ── render ──────────────────────────────────────────────────────────────────
const n = (x) => Math.round(x * 10) / 10;

function seg(a, b, w, op = 1, part = null) {
  // `part` names a body-part in the manifest; the bone is the segment itself.
  return { kind: 'line', a, b, w, op, part, bone: [a, b] };
}
function pts(j, view) {
  const out = [];
  const push = (p, r) => out.push({ x: p[0], y: p[1], r });
  push(j.pelvis, 20); push(j.chest, 20);
  push(j.headC, 32);
  const limbs = view === 'side'
    ? [j.armNear, j.armFar, j.legNear, j.legFar]
    : [j.armL, j.armR, j.legL, j.legR];
  for (const L of limbs) {
    for (const k of ['elbow', 'wrist', 'knee', 'ankle', 'toe']) if (L[k]) push(L[k], 12);
  }
  return out;
}

function drawArm(F, L, op) {
  return [
    seg(L.shoulder, L.elbow, F.w.upper, op, 'upper-arm'),
    seg(L.elbow, L.wrist, F.w.fore, op, 'forearm-hand'),
  ];
}
function drawLeg(F, L, op, view) {
  return [
    seg(L.hip, L.knee, F.w.thigh, op, 'thigh'),
    seg(L.knee, L.ankle, F.w.shin, op, 'shin'),
    seg(L.ankle, L.toe, F.w.foot, op, view === 'side' ? 'foot-side' : 'foot-front'),
  ];
}

/** One frame → a list of drawable primitives in figure space, back-to-front. */
export function draw(F, j, view, props = []) {
  const el = [];
  const backProps = props.filter((p) => p.z === 'back');
  const frontProps = props.filter((p) => p.z !== 'back');
  for (const p of backProps) el.push(p);

  if (view === 'side') {
    el.push(...drawArm(F, j.armFar, 0.35), ...drawLeg(F, j.legFar, 0.35, view));
    // torso: a quadratic through a bend control, so a cat arch or a cow dip is
    // one number instead of a second spine segment
    const mid = [(j.pelvis[0] + j.chest[0]) / 2, (j.pelvis[1] + j.chest[1]) / 2];
    const d = dir(j.torsoA); const normal = [d[1], -d[0]];
    const ctrl = add(mid, normal, j.bend);
    el.push({ kind: 'path', d: `M ${n(j.pelvis[0])} ${n(j.pelvis[1])} Q ${n(ctrl[0])} ${n(ctrl[1])} ${n(j.chest[0])} ${n(j.chest[1])}`, w: F.w.torso, part: 'torso-side', bone: [j.pelvis, j.chest] });
    el.push(...drawLeg(F, j.legNear, 1, view));
  } else {
    el.push(...drawLeg(F, j.legL, 1, view), ...drawLeg(F, j.legR, 1, view));
    el.push({
      kind: 'poly',
      d: `M ${n(j.hL[0])} ${n(j.hL[1])} L ${n(j.sL[0])} ${n(j.sL[1])} L ${n(j.sR[0])} ${n(j.sR[1])} L ${n(j.hR[0])} ${n(j.hR[1])} Z`,
      w: 16, fill: true, part: 'torso-front', bone: [j.pelvis, j.chest],
    });
  }

  // neck + head as ONE element: a manifest head part (which carries its own
  // hair) replaces all of it; the fallback expands to neck stroke + circle
  // (+ bun for the female figure)
  el.push({
    kind: 'head',
    part: view === 'side' ? 'head-side' : 'head-front',
    bone: [j.chest, add(j.headC, dir(j.neckA), F.headR)], // neck base → crown
    neckSeg: { a: j.chest, b: add(j.chest, dir(j.neckA), F.neck + F.headR * 0.35), w: F.w.neckW },
    circle: { c: j.headC, r: F.headR },
    bun: F.hair === 'bun'
      ? { c: add(j.headC, dir(j.neckA), F.headR * 1.08), r: F.headR * 0.38 }
      : null,
  });

  if (view === 'side') {
    el.push(...drawArm(F, j.armNear, 1));
  } else {
    el.push(...drawArm(F, j.armL, 1), ...drawArm(F, j.armR, 1));
  }
  for (const p of frontProps) el.push(p);
  return el;
}

// ── props ───────────────────────────────────────────────────────────────────
export function resolveProps(F, j, view, specs = []) {
  const out = [];
  for (const p of specs) {
    if (p.type === 'barbell') {
      const w = j.armNear.wrist;
      out.push({ kind: 'circle', c: w, r: 38, w: 9, fill: false, z: 'front', fit: 40 });
      out.push({ kind: 'circle', c: w, r: 5.5, fill: true, z: 'front' });
    } else if (p.type === 'dumbbell') {
      out.push({ kind: 'circle', c: j.armNear.wrist, r: 12.5, fill: true, z: 'front', fit: 14 });
      out.push({ kind: 'circle', c: j.armFar.wrist, r: 12.5, fill: true, op: 0.35, z: 'front', fit: 14 });
    } else if (p.type === 'barbell-front') {
      const a = j.armL.wrist, b = j.armR.wrist;
      const v = [b[0] - a[0], b[1] - a[1]];
      const len = Math.hypot(v[0], v[1]) || 1;
      const u = [v[0] / len, v[1] / len];
      const A = add(a, u, -52), B = add(b, u, 52);
      const perp = [-u[1], u[0]];
      out.push({ kind: 'line', a: A, b: B, w: 7, z: 'front' });
      for (const end of [A, B]) {
        out.push({ kind: 'line', a: add(end, perp, -21), b: add(end, perp, 21), w: 13, z: 'front', fit: 24 });
      }
    } else if (p.type === 'bench') {
      // the slab reaches under the HEAD too — a lying figure's head rests on
      // the bench, not past its end
      const y = Math.max(j.pelvis[1], j.chest[1]) + F.w.torso / 2 + 3;
      const x0 = Math.min(j.pelvis[0], j.chest[0]) - 46;
      const x1 = Math.max(j.pelvis[0], j.chest[0]) + F.neck + F.headR * 2 + 10;
      out.push({ kind: 'rect', x: x0, y, wd: x1 - x0, ht: 13, fill: true, z: 'back' });
      out.push({ kind: 'legrect', x: x0 + 12, y: y + 13, wd: 11, z: 'back' });
      out.push({ kind: 'legrect', x: x1 - 23, y: y + 13, wd: 11, z: 'back' });
    }
  }
  return out;
}

// ── fit + emit ──────────────────────────────────────────────────────────────
const VB = 512, PAD = 38;

function bounds(all) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of all) {
    x0 = Math.min(x0, p.x - p.r); y0 = Math.min(y0, p.y - p.r);
    x1 = Math.max(x1, p.x + p.r); y1 = Math.max(y1, p.y + p.r);
  }
  return { x0, y0, x1, y1 };
}

function propPts(props) {
  const out = [];
  for (const p of props) {
    if (p.kind === 'circle') out.push({ x: p.c[0], y: p.c[1], r: (p.fit ?? p.r) + (p.w ?? 0) });
    if (p.kind === 'line') { out.push({ x: p.a[0], y: p.a[1], r: p.fit ?? p.w }); out.push({ x: p.b[0], y: p.b[1], r: p.fit ?? p.w }); }
    if (p.kind === 'rect') { out.push({ x: p.x, y: p.y, r: 2 }); out.push({ x: p.x + p.wd, y: p.y + p.ht, r: 2 }); }
  }
  return out;
}

// Which palette slot a part colours from. The assets stay COLOURLESS — skin
// tone is a RENDER-TIME choice, which is what makes it user-selectable later
// (a Health profile setting) instead of 62 images × N tones. Hair as its own
// tone needs the head split into layers — future spec work, noted.
const PART_TINT = (slug) => (slug && slug.includes('shoe') ? 'attire' : 'skin');

/**
 * Render every frame of one exercise for one figure. ONE transform across all
 * frames, one shared ground line.
 *
 * opts.palette — { skin, attire?, gear? }: emit real colours instead of
 * `currentColor`. Without it the output stays mask-compatible monochrome.
 */
export function renderExercise(ex, sex, opts = {}) {
  const pal = opts.palette ?? null;
  const F = FIGURES[sex];
  const view = ex.view ?? 'side';
  const solved = ex.frames.map((fr) => {
    const j = solve(F, fr, view);
    const props = resolveProps(F, j, view, fr.props ?? ex.props ?? []);
    return { j, props, els: draw(F, j, view, props) };
  });

  const all = solved.flatMap(({ j, props }) => [...pts(j, view), ...propPts(props)]);
  const b = bounds(all);
  const s = Math.min((VB - 2 * PAD) / (b.x1 - b.x0), (VB - 2 * PAD) / (b.y1 - b.y0), 1.15);
  const tx = (VB - (b.x1 - b.x0) * s) / 2 - b.x0 * s;
  const ty = (VB - (b.y1 - b.y0) * s) / 2 - b.y0 * s;
  const T = ([x, y]) => [x * s + tx, y * s + ty];
  const groundY = n(b.y1 * s + ty + 3);

  const inkFill = pal ? pal.skin : 'currentColor';
  const gearFill = pal ? (pal.gear ?? pal.skin) : 'currentColor';

  /**
   * A manifest part rendered along its bone: uniform scale + rotation mapping
   * the part's anchors a→b onto the bone A→B in view space. One matrix, no
   * detection — the anchors are measured out of the ink at ingest.
   */
  const partEl = (e, op) => {
    const rec = MANIFEST[`${e.part}--${sex}`];
    if (!rec) return null;
    const A = T(e.bone[0]), B = T(e.bone[1]);
    const [ax, ay] = rec.a, [bx, by] = rec.b;
    const ab = [bx - ax, by - ay], AB = [B[0] - A[0], B[1] - A[1]];
    const sc = Math.hypot(AB[0], AB[1]) / (Math.hypot(ab[0], ab[1]) || 1);
    const th = Math.atan2(AB[1], AB[0]) - Math.atan2(ab[1], ab[0]);
    const k1 = Math.cos(th) * sc, k2 = Math.sin(th) * sc;
    const tx2 = A[0] - k1 * ax + k2 * ay, ty2 = A[1] - k2 * ax - k1 * ay;
    const fill = pal ? (pal[PART_TINT(e.part)] ?? pal.skin) : 'currentColor';
    return `<path d="${rec.d}" transform="matrix(${n(k1)} ${n(k2)} ${n(-k2)} ${n(k1)} ${n(tx2)} ${n(ty2)})" fill="${fill}" fill-rule="evenodd" stroke="none"${op}/>`;
  };

  return solved.map(({ els }) => {
    const parts = [];
    if (ex.ground !== false) {
      parts.push(`<line x1="${n(b.x0 * s + tx - 18)}" y1="${groundY}" x2="${n(b.x1 * s + tx + 18)}" y2="${groundY}" stroke-width="4" opacity="0.22"/>`);
    }
    for (const e of els) {
      const op = e.op && e.op !== 1 ? ` opacity="${e.op}"` : '';
      if (e.kind === 'line') {
        const p = e.part && partEl(e, op);
        if (p) { parts.push(p); continue; }
        const A = T(e.a), B = T(e.b);
        parts.push(`<line x1="${n(A[0])}" y1="${n(A[1])}" x2="${n(B[0])}" y2="${n(B[1])}" stroke-width="${n(e.w * s)}"${op}/>`);
      } else if (e.kind === 'head') {
        const p = partEl(e, op);
        if (p) { parts.push(p); continue; }
        const A = T(e.neckSeg.a), B = T(e.neckSeg.b), C = T(e.circle.c);
        parts.push(`<line x1="${n(A[0])}" y1="${n(A[1])}" x2="${n(B[0])}" y2="${n(B[1])}" stroke-width="${n(e.neckSeg.w * s)}"${op}/>`);
        parts.push(`<circle cx="${n(C[0])}" cy="${n(C[1])}" r="${n(e.circle.r * s)}" fill="${inkFill}" stroke="none"${op}/>`);
        if (e.bun) {
          const D = T(e.bun.c);
          parts.push(`<circle cx="${n(D[0])}" cy="${n(D[1])}" r="${n(e.bun.r * s)}" fill="${inkFill}" stroke="none"${op}/>`);
        }
      } else if (e.kind === 'circle') {
        const C = T(e.c);
        parts.push(`<circle cx="${n(C[0])}" cy="${n(C[1])}" r="${n(e.r * s)}"${e.fill ? ` fill="${gearFill}" stroke="none"` : ` fill="none" stroke-width="${n((e.w ?? 6) * s)}"`}${op}/>`);
      } else if (e.kind === 'path' || e.kind === 'poly') {
        const p = e.part && partEl(e, op);
        if (p) { parts.push(p); continue; }
        const d = e.d.replace(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g, (_, x, y) => {
          const P = T([+x, +y]); return `${n(P[0])} ${n(P[1])}`;
        });
        parts.push(`<path d="${d}" stroke-width="${n(e.w * s)}"${e.fill ? ` fill="${inkFill}"` : ' fill="none"'}${op}/>`);
      } else if (e.kind === 'rect') {
        const P = T([e.x, e.y]);
        parts.push(`<rect x="${n(P[0])}" y="${n(P[1])}" width="${n(e.wd * s)}" height="${n(e.ht * s)}" rx="${n(4 * s)}" fill="${gearFill}" stroke="none"${op}/>`);
      } else if (e.kind === 'legrect') {
        const P = T([e.x, e.y]);
        parts.push(`<rect x="${n(P[0])}" y="${n(P[1])}" width="${n(e.wd * s)}" height="${n(Math.max(groundY - P[1], 4))}" fill="${gearFill}" stroke="none"${op}/>`);
      }
    }
    return (
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB} ${VB}" ` +
      `stroke="${pal ? pal.skin : 'currentColor'}" fill="none" stroke-linecap="round" stroke-linejoin="round" color="#000">\n` +
      parts.join('\n') + '\n</svg>\n'
    );
  });
}
