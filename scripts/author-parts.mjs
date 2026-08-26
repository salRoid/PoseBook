#!/usr/bin/env node
// Author body parts PROCEDURALLY — smooth Catmull-Rom silhouettes from width
// profiles — and drop them into parts/inbox/ like any generated part.
//
//   node scripts/author-parts.mjs              write every part not already in inbox/done
//   node scripts/author-parts.mjs thigh f      just one part
//
// Why this exists beside generation: limbs, torsos and feet ARE smooth tapered
// shapes — a width profile through a spline is the honest way to draw one, and
// it produces both bodies from one definition with proportion factors. Heads
// carry the detail (hair, profile) where generation genuinely wins — a
// generated head landing in inbox/ later simply replaces the authored one at
// the next ingest. One pipeline either way.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTS, SEXES, fileFor } from '../parts/spec.mjs';

const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INBOX = join(ROOT, 'parts', 'inbox');
mkdirSync(INBOX, { recursive: true });

// ── smooth closed path through points (Catmull-Rom → cubic Béziers) ─────────
function smooth(pts) {
  const n = pts.length;
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + ' Z';
}

/** A vertical limb/trunk from a width profile: [y, halfWidth, cxOffset?][] */
function profileShape(prof, cx) {
  const right = prof.map(([y, w, o = 0]) => [cx + o + w, y]);
  const left = [...prof].reverse().map(([y, w, o = 0]) => [cx + o - w, y]);
  return smooth([...right, ...left]);
}

// k = overall width factor per sex; female hips/shoulders handled per-part
const K = { m: 1, f: 0.84 };

const DRAW = {
  // Width maths, established numerically: figure-units = px · bone/anchorSpan,
  // anchorSpan ≈ 0.76 of ink height for limbs (REG 0.12..0.88). So a thigh
  // peaking at 88px half-width renders ~33 units wide — everkinetic mass.
  // End caps taper GENTLY (extra waypoint) or Catmull-Rom overshoots into a
  // knob at the joint — the boot-shaped thigh of the first authored build.
  'upper-arm': (s) => profileShape([
    [52, 20 * K[s]], [90, 62 * K[s]], [170, 74 * K[s]], [280, 66 * K[s]],
    [400, 58 * K[s]], [520, 52 * K[s]], [640, 46 * K[s]], [716, 42 * K[s]], [744, 34 * K[s]], [758, 22 * K[s]],
  ], 150),
  'forearm-hand': (s) => profileShape([
    [48, 20 * K[s]], [100, 46 * K[s]], [190, 54 * K[s]], [330, 45 * K[s]],
    [480, 35 * K[s]], [600, 29 * K[s]], [656, 32 * K[s]], [716, 31 * K[s]], [748, 22 * K[s]], [764, 12 * K[s]],
  ], 150),
  thigh: (s) => profileShape([
    [50, 28 * K[s]], [110, 78 * K[s]], [230, 88 * K[s]], [390, 72 * K[s]],
    [540, 58 * K[s]], [670, 49 * K[s]], [730, 44 * K[s]], [758, 26 * K[s]],
  ], 150),
  shin: (s) => profileShape([
    [48, 26 * K[s]], [120, 60 * K[s]], [230, 66 * K[s]], [380, 48 * K[s]],
    [540, 35 * K[s]], [670, 30 * K[s]], [730, 28 * K[s]], [758, 16 * K[s]],
  ], 150),
  // side trunk: chest carried forward, small of the back, glutes behind
  'torso-side': (s) => profileShape([
    [120, 52 * K[s], 10], [180, 80 * K[s], 14], [280, 92 * K[s], 12],
    [420, 76 * K[s], -4], [540, 80 * K[s], -10], [640, 86 * K[s], -5],
    [716, 72 * K[s], 3], [752, 44 * K[s], 3],
  ], 200),
  // front trunk MUST reach the rig's shoulder span after bone-scaling:
  // scale ≈ 0.25, so male shoulders (58 units half) need ~232px half-width
  'torso-front': (s) => profileShape(s === 'm' ? [
    [118, 110], [156, 226], [250, 196], [400, 148], [520, 150], [640, 158], [716, 138], [756, 84],
  ] : [
    [118, 92], [156, 182], [250, 158], [400, 120], [520, 158], [640, 196], [716, 168], [756, 100],
  ], 250),
  'foot-front': (s) => profileShape([
    [60, 30 * K[s]], [120, 40 * K[s]], [180, 52 * K[s]], [232, 58 * K[s]], [262, 46 * K[s]],
  ], 150),
  'foot-side': (s) => smooth([
    [150, 74], [200, 68], [228, 96], [272, 124], [364, 142], [452, 154], [518, 162],
    [536, 186], [502, 208], [400, 212], [258, 212], [168, 206], [128, 180], [124, 120],
  ].map(([x, y]) => [x, y * (s === 'f' ? 0.94 : 1)])),
  // Heads: the SKULL must dominate the ink span or the bone-mapped head comes
  // out pea-sized — neck is a short stub, never a column (first build lesson).
  'head-front': (s) => {
    const r = s === 'm' ? 175 : 162;
    const bun = s === 'f' ? `<circle cx="200" cy="95" r="62" fill="black"/>` : '';
    const cy = (s === 'f' ? 100 : 35) + r;
    return { raw: `${bun}<circle cx="200" cy="${cy}" r="${r}" fill="black"/>` +
      `<path d="${profileShape([[cy + r - 40, 70 * K[s]], [cy + r + 90, 62 * K[s]], [cy + r + 150, 66 * K[s]]], 200)}" fill="black"/>` };
  },
  'head-side': () => {
    // female only — the male head-side is Codex's generated profile
    return { raw: `<circle cx="330" cy="140" r="60" fill="black"/>` +
      `<circle cx="200" cy="255" r="165" fill="black"/>` +
      `<path d="${profileShape([[380, 64], [470, 56], [545, 60]], 190)}" fill="black"/>` };
  },
};

const [onlyPart, onlySex] = process.argv.slice(2);
let wrote = 0;
for (const sex of SEXES) {
  for (const part of PARTS) {
    if (onlyPart && (part.slug !== onlyPart || (onlySex && sex.key !== onlySex))) continue;
    if (part.slug === 'head-side' && sex.key === 'm' && !onlyPart) continue; // Codex's, keep
    const f = fileFor(part.slug, sex.key);
    if (!onlyPart && (existsSync(join(INBOX, f)) || existsSync(join(INBOX, 'done', f)))) continue;
    const drawn = DRAW[part.slug]?.(sex.key);
    if (!drawn) continue;
    const inner = typeof drawn === 'string' ? `<path d="${drawn}" fill="black"/>` : drawn.raw;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${part.w}" height="${part.h}"><rect width="100%" height="100%" fill="white"/>${inner}</svg>`;
    const png = await sharp(Buffer.from(svg)).png().toBuffer();
    writeFileSync(join(INBOX, f), png);
    wrote++;
  }
}
console.log(`author-parts: ${wrote} part(s) written to parts/inbox/ — npm run ingest && npm run build`);
