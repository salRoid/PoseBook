#!/usr/bin/env node
// parts/inbox/ → parts/manifest.json. The step that makes a bad part unable to
// reach the figures — same shape as Foodsum's ingest, same reasons.
//
//   npm run ingest              ingest every file in parts/inbox/
//   npm run ingest -- --dry     validate + trace, write nothing
//   npm run ingest -- --keep    leave sources in inbox/ instead of inbox/done/
//
// Per file: validate the name against parts/spec.mjs → normalise onto the spec
// canvas → binarise → trace the silhouette to smooth vector contours → store
// the path with the spec's anchor coordinates in the manifest. All-or-nothing
// per file; a blank or inverted image is rejected with the reason.
//
// ── THE TRACER, and why it is shaped like this ──
// v1 used marching squares straight over the full-resolution bitmap. A real
// generated image killed it: JPEG-noise edges dither into thousands of
// one-pixel contours and a buggy saddle case walked forever — the process died
// on the FIRST real part. The synthetic test parts never exercised any of
// that, which is its own lesson. v2:
//   1. sharp preprocess — flatten to white, greyscale, slight blur: kills the
//      compression speckle before it can become geometry;
//   2. trace on a DOWNSCALED grid (≤340px tall) — bounds every cost, and a
//      silhouette loses nothing at that size;
//   3. flood-fill components, then Moore-neighbour boundary tracing — a
//      textbook algorithm with a real termination criterion, no saddle cases;
//   4. Chaikin corner-cutting ×2 then Douglas–Peucker — pixel staircases come
//      out as smooth curves;
//   5. coordinates scaled back to the spec canvas, where the anchors live.
//
// sharp is a devDependency of the SCRIPTS only (hoisted from the workspace
// root, Foodsum's arrangement) — the engine stays dependency-free and reads
// only the manifest.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTS, SEXES, REG } from '../parts/spec.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INBOX = join(ROOT, 'parts', 'inbox');
const MANIFEST = join(ROOT, 'parts', 'manifest.json');
const DRY = process.argv.includes('--dry');
const KEEP = process.argv.includes('--keep');

let sharp;
try { ({ default: sharp } = await import('sharp')); }
catch { console.error('kinetic: sharp is not resolvable — run npm install at the workspace root.'); process.exit(1); }

const SPEC = new Map(PARTS.map((p) => [p.slug, p]));
const SEXKEYS = new Set(SEXES.map((s) => s.key));
const TRACE_H = 340; // trace-grid height cap

// ── tracing ─────────────────────────────────────────────────────────────────

/** Iterative flood fill; returns a component label grid + sizes. */
function components(ink, W, H) {
  const label = new Int32Array(W * H).fill(-1);
  const sizes = [];
  const stack = [];
  for (let i = 0; i < W * H; i++) {
    if (!ink[i] || label[i] >= 0) continue;
    const id = sizes.length;
    let size = 0;
    stack.push(i);
    label[i] = id;
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % W, y = (p / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (ink[q] && label[q] < 0) { label[q] = id; stack.push(q); }
      }
    }
    sizes.push(size);
  }
  return { label, sizes };
}

/**
 * Moore-neighbour boundary tracing with Jacob's stopping criterion — walks the
 * outer boundary of one component. Terminates by construction, which is the
 * property v1's marching-squares walk lacked.
 */
const MOORE = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
function boundary(isInk, start, W, H) {
  const pts = [start];
  let cur = start;
  let dirIdx = 6; // came from above (we scan top-to-bottom, so entry is from -y)
  for (let steps = 0; steps < W * H * 4; steps++) {
    let found = -1;
    for (let k = 0; k < 8; k++) {
      const d = (dirIdx + 6 + k) % 8; // start looking backwards-left of entry
      const nx = cur[0] + MOORE[d][0], ny = cur[1] + MOORE[d][1];
      if (nx >= 0 && ny >= 0 && nx < W && ny < H && isInk(nx, ny)) { found = d; break; }
    }
    if (found < 0) break; // isolated pixel
    cur = [cur[0] + MOORE[found][0], cur[1] + MOORE[found][1]];
    dirIdx = found;
    if (cur[0] === start[0] && cur[1] === start[1]) break;
    pts.push(cur);
  }
  return pts;
}

/** Chaikin corner cutting on a closed polygon — staircase in, curve out. */
function chaikin(pts) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
    out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
  }
  return out;
}

function simplify(pts, eps) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i0, i1] = stack.pop();
    const [ax, ay] = pts[i0], [bx, by] = pts[i1];
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    let maxD = 0, maxI = -1;
    for (let i = i0 + 1; i < i1; i++) {
      const d = Math.abs(dy * (pts[i][0] - ax) - dx * (pts[i][1] - ay)) / len;
      if (d > maxD) { maxD = d; maxI = i; }
    }
    if (maxD > eps) { keep[maxI] = 1; stack.push([i0, maxI], [maxI, i1]); }
  }
  return pts.filter((_, i) => keep[i]);
}

async function tracePart(file, spec) {
  // small trace grid at the spec canvas's aspect
  const th = TRACE_H, tw = Math.max(24, Math.round((spec.w / spec.h) * TRACE_H));
  const { data, info } = await sharp(file)
    .flatten({ background: '#ffffff' })
    .resize(tw, th, { fit: 'fill' })
    .greyscale()
    .blur(0.8)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height;
  const ink = new Uint8Array(W * H);
  let inkCount = 0;
  for (let i = 0; i < W * H; i++) if (data[i] < 150) { ink[i] = 1; inkCount++; }

  const frac = inkCount / (W * H);
  if (frac < 0.02) throw new Error(`traces to almost nothing (${(frac * 100).toFixed(1)}% ink) — blank, or not a dark silhouette`);
  if (frac > 0.85) throw new Error(`almost solid ink (${(frac * 100).toFixed(1)}%) — probably inverted (white part on black)`);

  const { label, sizes } = components(ink, W, H);
  const sx = spec.w / W, sy = spec.h / H;
  const paths = [];
  for (let id = 0; id < sizes.length; id++) {
    if (sizes[id] < W * H * 0.004) continue; // speckle
    // topmost-leftmost pixel of this component
    let start = null;
    for (let i = 0; i < W * H && !start; i++) if (label[i] === id) start = [i % W, (i / W) | 0];
    const isInk = (x, y) => label[y * W + x] === id;
    let pts = boundary(isInk, start, W, H);
    if (pts.length < 12) continue;
    pts = simplify(chaikin(chaikin(pts)), 0.55);
    paths.push(`M${pts.map(([x, y]) => `${Math.round(x * sx * 10) / 10} ${Math.round(y * sy * 10) / 10}`).join('L')}Z`);
  }
  if (!paths.length) throw new Error('no usable contour found');

  // ── auto-register the anchors from the INK, per the spec's REG rules ──
  // find the ink bbox and the centroid of each row/column on the trace grid
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let i = 0; i < W * H; i++) {
    if (!ink[i]) continue;
    const x = i % W, y = (i / W) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const rowCx = (y) => {
    let sum = 0, c = 0;
    for (let x = 0; x < W; x++) if (ink[y * W + x]) { sum += x; c++; }
    return c ? sum / c : (x0 + x1) / 2;
  };
  const colCy = (x) => {
    let sum = 0, c = 0;
    for (let y = 0; y < H; y++) if (ink[y * W + x]) { sum += y; c++; }
    return c ? sum / c : (y0 + y1) / 2;
  };
  const reg = REG[spec.slug];
  const at = (frac) => {
    if (reg.axis === 'y') {
      const y = Math.round(y0 + (y1 - y0) * frac);
      return [rowCx(y) * sx, y * sy];
    }
    const x = Math.round(x0 + (x1 - x0) * frac);
    return [x * sx, colCy(x) * sy];
  };
  const a = at(reg.aFrac).map((v) => Math.round(v * 10) / 10);
  const b = at(reg.bFrac).map((v) => Math.round(v * 10) / 10);

  return { d: paths.join(''), a, b };
}

// ── the run ─────────────────────────────────────────────────────────────────
mkdirSync(INBOX, { recursive: true });
const files = readdirSync(INBOX)
  .filter((f) => !f.startsWith('.') && f !== 'done' && statSync(join(INBOX, f)).isFile())
  .sort();
if (files.length === 0) {
  console.log('\nkinetic: parts/inbox/ is empty. Run `npm run missing` for the queue.\n');
  process.exit(0);
}

const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};
let ok = 0; const failures = [];

for (const file of files) {
  try {
    const m = basename(file, extname(file)).match(/^([a-z0-9-]+)--([mf])$/);
    if (!m || !SPEC.has(m[1]) || !SEXKEYS.has(m[2])) {
      throw new Error('name must be <part>--<m|f>.png for a part in parts/spec.mjs — run npm run missing for the list');
    }
    const spec = SPEC.get(m[1]);
    const { d, a, b } = await tracePart(join(INBOX, file), spec);
    manifest[`${m[1]}--${m[2]}`] = {
      d, w: spec.w, h: spec.h, a, b,
      ingestedAt: new Date().toISOString().slice(0, 10), sourceFile: file,
    };
    ok++;
    console.log(`  ✓ ${file}  →  ${(d.length / 1024).toFixed(1)}KB path`);
    if (!DRY && !KEEP) {
      mkdirSync(join(INBOX, 'done'), { recursive: true });
      renameSync(join(INBOX, file), join(INBOX, 'done', file));
    }
  } catch (err) {
    failures.push(file);
    console.log(`  ✗ ${file}\n      ${err.message}`);
  }
}

if (ok > 0 && !DRY) writeFileSync(MANIFEST, JSON.stringify(manifest, null, 1) + '\n');
console.log(`\n  ${ok} ingested, ${failures.length} rejected${DRY ? ' (dry run — manifest not written)' : ''}. Next: npm run build, then LOOK at dist/sheet.html.\n`);
if (failures.length) process.exit(1);
