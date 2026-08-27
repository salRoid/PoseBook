#!/usr/bin/env node
// frames/inbox/ → frames/corpus/<slug>/<sex>/frame-N.svg — the enforcement
// step for generated WHOLE-FIGURE strips, Foodsum-shaped: a strip that cannot
// meet the contract writes nothing and says why.
//
//   npm run ingest-frames             ingest every strip in frames/inbox/
//   npm run ingest-frames -- --dry    validate + split, write nothing
//
// Per strip: validate the name against the plan → check the cell grammar
// (N equal square cells side by side) → resolve the background (real alpha,
// or a dark background keyed out; an opaque WHITE background is unusable
// under white ink and is rejected) → split into frames → downscale to 512 →
// wrap each frame as a mask-compatible SVG → sidecar with the style version.
//
// The SVG wrap embeds the PNG rather than tracing it, deliberately: Health's
// mask reads ALPHA, which an embedded PNG carries perfectly — and tracing
// would destroy the hand-drawn sketch texture that is the whole point of the
// style. Bryl's files are true vectors; these are equivalent to the renderer.

import { readdirSync, readFileSync, writeFileSync, mkdirSync, renameSync, existsSync, statSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DONE = join(ROOT, 'frames', 'inbox', 'done');
const INBOX = join(ROOT, 'frames', 'inbox');
const CORPUS = join(ROOT, 'frames', 'corpus');
const DRY = process.argv.includes('--dry');
const REINGEST = process.argv.includes('--reingest');
const CELL = 512;

// ── frame-to-frame registration ─────────────────────────────────────────
// A hand-drawn strip is never pixel-perfectly registered across its cells —
// Codex draws each figure freehand within its own third/half of the canvas,
// and even a few percent of horizontal drift between cells reads as the
// whole figure SLIDING when the frames ping-pong ("why are people animating
// moving left and right"). A plain equal-width column split preserves
// whatever drift the source has; this re-centers each cell on its OWN ink
// bounding box before scaling, so every frame's figure sits at the same
// horizontal position regardless of how it was drawn.
//
// Deliberately horizontal-only: vertical motion (a squat's hips dropping, a
// back extension's torso hinging) is the pose changing and must be
// preserved — centering that too would erase real range of motion. Sliding
// left/right is never real range of motion for any of these movements; the
// figure's base (feet, seat, standing point) does not travel sideways.
function centerCellHorizontally(raw, imgW, imgH, cellLeft, cellW) {
  let minX = cellW, maxX = -1;
  for (let y = 0; y < imgH; y++) {
    const rowBase = y * imgW * 4;
    for (let x = 0; x < cellW; x++) {
      if (raw[rowBase + (cellLeft + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
  }
  if (maxX < 0) return { buf: raw.subarray(0, 0), shift: 0, empty: true }; // no ink in this cell — let the caller surface a clear error

  const shift = Math.round(cellW / 2 - (minX + maxX) / 2);
  const out = Buffer.alloc(cellW * imgH * 4, 0);
  for (let y = 0; y < imgH; y++) {
    const srcRow = y * imgW * 4, dstRow = y * cellW * 4;
    // copy the whole cell row shifted by `shift`, clipped to [0, cellW)
    const srcStart = Math.max(0, -shift), srcEnd = Math.min(cellW, cellW - shift);
    if (srcEnd <= srcStart) continue;
    raw.copy(out, dstRow + (srcStart + shift) * 4, srcRow + (cellLeft + srcStart) * 4, srcRow + (cellLeft + srcEnd) * 4);
  }
  return { buf: out, shift, empty: false };
}

let sharp;
try { ({ default: sharp } = await import('sharp')); }
catch { console.error('kinetic: sharp is not resolvable — run npm install at the workspace root.'); process.exit(1); }

const PLAN = JSON.parse(readFileSync(join(ROOT, 'poses', 'PLAN.json'), 'utf8'));
const BYSLUG = new Map(PLAN.map((r) => [r.slug, r]));
const styleVersion = (readFileSync(join(ROOT, 'frames', 'STYLE.md'), 'utf8')
  .match(/\*\*Style version: (v\d+)\.\*\*/) ?? [, 'v?'])[1];

mkdirSync(INBOX, { recursive: true });
// --reingest re-runs the CURRENT logic (i.e. the centering fix) over every
// strip already archived to done/, retroactively fixing already-filed corpus
// entries with no new generation needed — this was a filing bug, not an art
// problem, so the existing art is fine and only needs re-slicing.
const SRC = REINGEST ? DONE : INBOX;
mkdirSync(SRC, { recursive: true });
const files = readdirSync(SRC)
  .filter((f) => !f.startsWith('.') && f !== 'done' && statSync(join(SRC, f)).isFile())
  .sort();
if (files.length === 0) {
  // An empty inbox means the GENERATION step has not happened — this script
  // only files strips, it does not create them. Print the next brief in full
  // so the message is an instruction, not a fact: an agent that lands here
  // has everything it needs to act without reading another file.
  const bp = join(ROOT, 'dist', 'briefs.json');
  console.log('\nkinetic: frames/inbox/ is empty — nothing to ingest.');
  console.log('This step FILES strips; it does not generate them. Generate first, then re-run.\n');
  if (existsSync(bp)) {
    const { anchor, briefs } = JSON.parse(readFileSync(bp, 'utf8'));
    const done = new Set(existsSync(CORPUS)
      ? readdirSync(CORPUS).flatMap((slug) => {
          const d = join(CORPUS, slug);
          return statSync(d).isDirectory() ? readdirSync(d).map((sx) => `${slug}--${sx}`) : [];
        })
      : []);
    const anchorDone = done.has(anchor);
    const next = briefs.find((b) => (anchorDone ? !done.has(`${b.slug}--${b.sex}`) : `${b.slug}--${b.sex}` === anchor));
    if (next) {
      console.log(anchorDone
        ? `NEXT (${briefs.length - done.size} of ${briefs.length} remaining):`
        : `THE ANCHOR — generate this one first, then stop for review:`);
      console.log(`\n  save as: ${next.file}`);
      if (next.refs.length) console.log(`  pose reference: ${next.refs.join(' · ')}`);
      console.log(`\n  ${next.prompt}\n`);
    } else {
      console.log('Every brief has been ingested. Nothing left to generate.\n');
    }
  } else {
    console.log('Run `npm run brief` first to write dist/briefs.json (the queue).\n');
  }
  process.exit(0);
}

let ok = 0; const failures = [];

for (const file of files) {
  try {
    const m = basename(file, extname(file)).match(/^([a-z0-9-]+)--([mf])$/);
    if (!m || !BYSLUG.has(m[1])) {
      throw new Error('name must be <plan-slug>--<m|f>.png — dist/briefs.json names the exact file per brief');
    }
    const [, slug, sex] = m;
    const plan = BYSLUG.get(slug);
    const N = plan.frames;

    let img = sharp(join(SRC, file));
    const meta = await img.metadata();

    // cell grammar: N square-ish cells side by side
    const ratio = meta.width / meta.height;
    if (Math.abs(ratio - N) > N * 0.18) {
      throw new Error(`expected ${N} square cell(s) side by side (ratio ≈ ${N}:1), got ${meta.width}x${meta.height} (${ratio.toFixed(2)}:1)`);
    }

    // background: real alpha wins; a dark opaque background is keyed to alpha
    // from luminance (white ink = opaque); an opaque WHITE background cannot
    // carry white ink and is rejected outright.
    const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const px = (x, y) => {
      const i = (y * info.width + x) * 4;
      return { r: data[i], g: data[i + 1], b: data[i + 2], a: data[i + 3] };
    };
    const corners = [px(1, 1), px(info.width - 2, 1), px(1, info.height - 2), px(info.width - 2, info.height - 2)];
    const transparent = corners.every((c) => c.a < 24);
    const lum = (c) => 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
    let strip;
    if (transparent) {
      strip = data; // already what we need
    } else if (corners.every((c) => lum(c) < 70)) {
      // dark background: alpha := luminance, ink := white
      strip = Buffer.from(data);
      for (let i = 0; i < strip.length; i += 4) {
        const L = lum({ r: strip[i], g: strip[i + 1], b: strip[i + 2] });
        strip[i] = 255; strip[i + 1] = 255; strip[i + 2] = 255;
        strip[i + 3] = Math.min(255, Math.round(L * 1.15));
      }
    } else {
      throw new Error('background is opaque and light — white ink on a white background is unusable; regenerate with a transparent (or dark) background');
    }

    // split → RE-CENTER on each cell's own ink → downscale → wrap
    const cellW = Math.floor(info.width / N);
    const outs = [];
    const shifts = [];
    for (let i = 0; i < N; i++) {
      const centered = centerCellHorizontally(strip, info.width, info.height, i * cellW, cellW);
      if (centered.empty) throw new Error(`frame ${i + 1} of ${N} has no ink at all — a blank cell, regenerate`);
      shifts.push(centered.shift);
      const png = await sharp(centered.buf, { raw: { width: cellW, height: info.height, channels: 4 } })
        .resize(CELL, CELL, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      outs.push(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${CELL} ${CELL}" width="${CELL}" height="${CELL}">` +
        `<image width="${CELL}" height="${CELL}" href="data:image/png;base64,${png.toString('base64')}"/></svg>\n`,
      );
    }
    // A large shift means the source cell was badly off-register to begin
    // with — still fixed, but worth flagging in case it signals a worse
    // problem (e.g. two figures bleeding across a cell boundary).
    const maxShift = Math.max(...shifts.map(Math.abs));
    const shiftWarning = maxShift > cellW * 0.12 ? `  (large registration shift: ${maxShift}px of ${cellW}px cell — worth a look)` : '';

    const dir = join(CORPUS, slug, sex);
    const kb = (outs.reduce((a, s2) => a + s2.length, 0) / 1024).toFixed(0);
    console.log(`  ✓ ${file}  →  ${N} frame(s), ${kb}KB total${shiftWarning}`);
    if (!DRY) {
      mkdirSync(dir, { recursive: true });
      outs.forEach((svg, i) => writeFileSync(join(dir, `frame-${i + 1}.svg`), svg));
      writeFileSync(join(dir, 'meta.json'), JSON.stringify({
        styleVersion, ingestedAt: new Date().toISOString().slice(0, 10),
        sourceFile: file, sourceSize: `${meta.width}x${meta.height}`,
        frames: N, background: transparent ? 'alpha' : 'keyed-from-dark',
        centeringShiftsPx: shifts,
      }, null, 2) + '\n');
      if (!REINGEST) {
        mkdirSync(join(INBOX, 'done'), { recursive: true });
        renameSync(join(INBOX, file), join(INBOX, 'done', file));
      } // --reingest reads FROM done/ already — nothing to move
    }
    ok++;
  } catch (err) {
    failures.push(file);
    console.log(`  ✗ ${file}\n      ${err.message}`);
  }
}

console.log(`\n  ${ok} ingested, ${failures.length} rejected${DRY ? ' (dry run — nothing written)' : ''}. LOOK at every frame before export — a wrong movement is the failure this pipeline exists to stop.\n`);
if (failures.length) process.exit(1);
