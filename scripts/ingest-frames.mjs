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

// ── cutting the strip into frames ───────────────────────────────────────
// A strip is NOT N equal columns. Codex draws each figure freehand, wider
// or narrower than its nominal third, and a lunging leg or a reaching arm
// routinely crosses the arithmetic boundary — so a plain width/N split
// leaves a foot from frame 2 hanging in frame 1 ("hands from left/right
// show in the other frame"). Some strips also carry a DRAWN divider line
// between cells, which the same split bakes into every frame as a stray
// edge rule.
//
// So the cut is found from the picture, not from arithmetic:
//   1. column ink profile over the whole strip;
//   2. drawn dividers (a narrow near-full-height column run sitting near a
//      nominal boundary) are erased before anything else looks at the ink;
//   3. each cut lands in the middle of a real GUTTER — a run of empty
//      columns — choosing, near each nominal boundary, the widest gutter
//      closest to it;
//   4. only when no gutter exists does it fall back to the least-inked
//      column — and even then nothing is sliced, because the cut only says
//      which frame each whole ink component belongs to (see below).
//
// Frames are then composed onto ONE canvas size shared by the whole strip,
// each centred on its own ink. Shared canvas = shared scale, so the figure
// cannot change size between frames; per-frame centring is what stops it
// sliding left/right when the frames ping-pong.
//
// Horizontal only, deliberately: vertical motion (a squat's hips dropping,
// a back extension hinging) is the pose changing and must be preserved.
const INK = 16;          // alpha above which a pixel counts as ink

function columnProfile(raw, W, H) {
  const col = new Int32Array(W);
  for (let y = 0; y < H; y++) {
    const rowBase = y * W * 4;
    for (let x = 0; x < W; x++) if (raw[rowBase + x * 4 + 3] > INK) col[x]++;
  }
  return col;
}

// A drawn separator: a run at most ~1% of the strip wide, inked over ≥88% of
// the height, sitting within a third of a cell of a nominal boundary. Erased
// from the raster (not just the profile) so it can never reach a frame.
function eraseDividers(raw, col, W, H, N) {
  const cellW = W / N, maxRun = Math.max(6, Math.round(W * 0.01));
  const erased = [];
  let x = 0;
  while (x < W) {
    if (col[x] < H * 0.88) { x++; continue; }
    let end = x;
    while (end + 1 < W && col[end + 1] >= H * 0.88) end++;
    const width = end - x + 1, mid = (x + end) / 2;
    const nearBoundary = Array.from({ length: N - 1 }, (_, k) => (k + 1) * cellW)
      .some((b) => Math.abs(mid - b) < cellW * 0.33);
    if (width <= maxRun && nearBoundary) {
      for (let y = 0; y < H; y++) {
        for (let c = x; c <= end; c++) raw[(y * W + c) * 4 + 3] = 0;
      }
      for (let c = x; c <= end; c++) col[c] = 0;
      erased.push(`${x}-${end}`);
    }
    x = end + 1;
  }
  return erased;
}

// Where to cut: the middle of a real gutter near each nominal boundary.
function chooseCuts(col, W, H, N) {
  const cellW = W / N;
  const blank = Math.max(0, Math.floor(H * 0.004)); // a column this faint is empty (stray speck, keying noise)
  const gutters = [];
  let run = -1;
  for (let x = 0; x < W; x++) {
    const empty = col[x] <= blank;
    if (empty && run < 0) run = x;
    if (!empty && run >= 0) { gutters.push([run, x - 1]); run = -1; }
  }
  if (run >= 0) gutters.push([run, W - 1]);
  const interior = gutters.filter(([a, b]) => a > 0 && b < W - 1);

  const cuts = [], forced = [];
  let prev = 0;
  for (let k = 1; k < N; k++) {
    const ideal = k * cellW;
    let best = null, bestScore = -Infinity;
    for (const [a, b] of interior) {
      const mid = (a + b) / 2;
      if (mid <= prev + cellW * 0.25) continue;          // must leave a real frame behind it
      if (Math.abs(mid - ideal) > cellW * 0.45) continue; // and still be this boundary, not the next one
      // a wide gutter beats a near one, but only up to a point
      const score = Math.min(b - a + 1, cellW * 0.2) / (cellW * 0.2)
                  - Math.abs(mid - ideal) / (cellW * 0.45);
      if (score > bestScore) { bestScore = score; best = mid; }
    }
    if (best === null) {
      // no gutter at all — the figures touch. Cut where the least ink is and
      // let the fragment prune clean up what the knife goes through.
      const lo = Math.max(1, Math.round(ideal - cellW * 0.3));
      const hi = Math.min(W - 2, Math.round(ideal + cellW * 0.3));
      let m = lo;
      for (let x = lo; x <= hi; x++) if (col[x] < col[m]) m = x;
      best = m;
      forced.push(k);
    }
    cuts.push(Math.round(best));
    prev = best;
  }
  return { cuts, forced };
}

// Nothing is ever cut through. The strip's ink is labelled into connected
// components, and each component goes WHOLE to the frame its centre of mass
// falls in. That is what a straight cut cannot do: in a dead-bug the lying
// figure's extended leg reaches past the gutter into the next third, so any
// vertical knife either amputates that leg or leaves a floating shoe in the
// next frame. As one component, the leg simply travels with its own figure.
//
// A component wider than 1.5 cells is not a figure — it is something drawn
// ACROSS the strip (a ground line, a shared floor). Those alone are split at
// the cut and appear in every frame, which is what they are for.
function labelComponents(raw, W, H) {
  const label = new Int32Array(W * H).fill(-1);
  const stack = new Int32Array(W * H);
  const comps = [];
  for (let p = 0; p < W * H; p++) {
    if (raw[p * 4 + 3] <= INK || label[p] >= 0) continue;
    const id = comps.length;
    let top = 0, size = 0, sumX = 0, minX = W, maxX = -1;
    stack[top++] = p; label[p] = id;
    while (top > 0) {
      const q = stack[--top];
      const qx = q % W, qy = (q / W) | 0;
      size++; sumX += qx;
      if (qx < minX) minX = qx;
      if (qx > maxX) maxX = qx;
      if (qx > 0 && raw[(q - 1) * 4 + 3] > INK && label[q - 1] < 0) { label[q - 1] = id; stack[top++] = q - 1; }
      if (qx < W - 1 && raw[(q + 1) * 4 + 3] > INK && label[q + 1] < 0) { label[q + 1] = id; stack[top++] = q + 1; }
      if (qy > 0 && raw[(q - W) * 4 + 3] > INK && label[q - W] < 0) { label[q - W] = id; stack[top++] = q - W; }
      if (qy < H - 1 && raw[(q + W) * 4 + 3] > INK && label[q + W] < 0) { label[q + W] = id; stack[top++] = q + W; }
    }
    comps.push({ size, minX, maxX, cx: sumX / size });
  }
  return { label, comps };
}

const frameOf = (x, cuts) => { let i = 0; while (i < cuts.length && x >= cuts[i]) i++; return i; };

// Copy one frame onto the shared canvas, centred on its own ink. Only pixels
// belonging to this frame's components are copied — a neighbour's hand or
// foot standing in this frame's column is simply not this frame's ink.
function composeFrame(raw, label, comps, W, H, canvasW, frame, span, bounds) {
  const out = Buffer.alloc(canvasW * H * 4, 0);
  const shift = Math.round(canvasW / 2 - (bounds.x0 + bounds.x1) / 2);
  for (let y = 0; y < H; y++) {
    for (let x = bounds.x0; x <= bounds.x1; x++) {
      const p = y * W + x;
      const id = label[p];
      if (id < 0) continue;
      const c = comps[id];
      const mine = c.shared ? (x >= span.from && x < span.to) : c.owner === frame;
      if (!mine) continue;
      const dx = x + shift;
      if (dx < 0 || dx >= canvasW) continue;
      raw.copy(out, ((y * canvasW) + dx) * 4, p * 4, p * 4 + 4);
    }
  }
  return { buf: out, shift };
}

let sharp;
try { ({ default: sharp } = await import('sharp')); }
catch { console.error('posebook: sharp is not resolvable — run npm install at the workspace root.'); process.exit(1); }

const PLAN = JSON.parse(readFileSync(join(ROOT, 'poses', 'PLAN.json'), 'utf8'));
// Per-strip filing corrections — see frames/corrections.json for what belongs
// there. Kept OUT of the review db on purpose: a review is a judgement about
// art, this is an instruction to the splitter, and it has to be applied on
// every --reingest or it silently disappears.
const CORRECTIONS = (() => {
  const p = join(ROOT, 'frames', 'corrections.json');
  if (!existsSync(p)) return {};
  const raw = JSON.parse(readFileSync(p, 'utf8'));
  delete raw._readme;
  return raw;
})();
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
  console.log('\nposebook: frames/inbox/ is empty — nothing to ingest.');
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

    // find the real cuts → compose each frame on a shared canvas → wrap
    const cellW = Math.floor(info.width / N);
    const col = columnProfile(strip, info.width, info.height);
    const dividers = N > 1 ? eraseDividers(strip, col, info.width, info.height, N) : [];
    const { cuts, forced } = N > 1
      ? chooseCuts(col, info.width, info.height, N)
      : { cuts: [], forced: [] };

    // Ink → components → each component whole to one frame.
    const { label, comps } = labelComponents(strip, info.width, info.height);
    let reclaimed = 0, shared = 0;
    for (const c of comps) {
      c.shared = (c.maxX - c.minX + 1) > cellW * 1.5;
      c.owner = frameOf(c.cx, cuts);
      if (c.shared) shared++;
      // ink that a straight cut would have put in the wrong frame
      else if (frameOf(c.minX, cuts) !== c.owner || frameOf(c.maxX, cuts) !== c.owner) reclaimed += c.size;
    }

    const spans = [];
    for (let i = 0; i < N; i++) {
      const from = i === 0 ? 0 : cuts[i - 1];
      const to = i === N - 1 ? info.width : cuts[i];
      let x0 = info.width, x1 = -1;
      for (const c of comps) {
        if (c.shared) { x0 = Math.min(x0, Math.max(c.minX, from)); x1 = Math.max(x1, Math.min(c.maxX, to - 1)); }
        else if (c.owner === i) { x0 = Math.min(x0, c.minX); x1 = Math.max(x1, c.maxX); }
      }
      if (x1 < 0) throw new Error(`frame ${i + 1} of ${N} has no ink at all — a blank cell, regenerate`);
      spans.push({ from, to, bounds: { x0, x1 } });
    }

    // One canvas for the whole strip: same size ⇒ same scale in every frame,
    // so the figure cannot grow or shrink between frames.
    const widest = Math.max(...spans.map((s2) => s2.bounds.x1 - s2.bounds.x0 + 1));
    const canvasW = Math.max(cellW, widest + Math.round(widest * 0.04));

    // A frame drawn facing the wrong way is a GENERATION defect, but for a
    // side-on figure of a symmetric movement a horizontal flip is an exact
    // repair, so frames/corrections.json can name the frames to flip rather
    // than the strip waiting on a redraw. Nothing else here touches the art.
    const mirrorFrames = new Set(CORRECTIONS[`${slug}--${sex}`]?.mirrorFrames ?? []);

    const outs = [];
    const shifts = [];
    for (let i = 0; i < N; i++) {
      const framed = composeFrame(strip, label, comps, info.width, info.height, canvasW, i, spans[i], spans[i].bounds);
      shifts.push(framed.shift);
      let pipe = sharp(framed.buf, { raw: { width: canvasW, height: info.height, channels: 4 } });
      if (mirrorFrames.has(i + 1)) pipe = pipe.flop();
      const png = await pipe
        .resize(CELL, CELL, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      // THE INK IS `currentColor`, NOT WHITE. The embedded PNG's pixels are
      // white, which is unusable as art: on a light screen a white figure is
      // invisible, and the corpus has to work on both themes. So the PNG is
      // never painted directly — it is used as a MASK, and what actually
      // renders is a `currentColor` rect showing through it. The ink then
      // follows the CSS `color` of whatever element the SVG sits in, so
      // light/dark mode is a colour change on the host, not a second corpus.
      //
      // The mask is luminance-type (the SVG default): the ink is pure white,
      // so mask value = luminance × alpha = alpha, which preserves every
      // anti-aliased edge exactly. This also keeps the OLD contract intact —
      // the SVG's own alpha is still precisely the ink alpha, so Health's CSS
      // mask, which reads alpha, reads the same shape it always did.
      //
      // Mask ids must be unique per FILE, not per document: several of these
      // SVGs get inlined into one page (the gallery does exactly this), and a
      // repeated id makes every figure render through the first one's mask.
      const mid = `k-${slug}-${sex}-${i + 1}`;
      outs.push(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${CELL} ${CELL}" width="${CELL}" height="${CELL}">` +
        `<mask id="${mid}" maskUnits="userSpaceOnUse" x="0" y="0" width="${CELL}" height="${CELL}">` +
        `<image width="${CELL}" height="${CELL}" href="data:image/png;base64,${png.toString('base64')}"/></mask>` +
        `<rect width="${CELL}" height="${CELL}" fill="currentColor" mask="url(#${mid})"/></svg>\n`,
      );
    }
    // What is worth a human's eye afterwards: a cut with no gutter to land
    // in, and ink that had to be reclaimed across one. A divider erased is
    // routine and only recorded in meta.
    const notes = [];
    if (forced.length) notes.push(`forced cut at boundary ${forced.join(', ')} — no gutter, frames touch`);
    if (reclaimed > 0) notes.push(`${reclaimed}px of ink reclaimed across a cut`);
    if (mirrorFrames.size) notes.push(`frame ${[...mirrorFrames].join(', ')} mirrored per frames/corrections.json`);
    if (shared > 0) notes.push(`${shared} element(s) drawn across the strip, split at the cut`);
    const warning = notes.length ? `  (${notes.join('; ')} — look at this one)` : '';

    const dir = join(CORPUS, slug, sex);
    const kb = (outs.reduce((a, s2) => a + s2.length, 0) / 1024).toFixed(0);
    console.log(`  ✓ ${file}  →  ${N} frame(s), ${kb}KB total${warning}`);
    if (!DRY) {
      mkdirSync(dir, { recursive: true });
      outs.forEach((svg, i) => writeFileSync(join(dir, `frame-${i + 1}.svg`), svg));
      writeFileSync(join(dir, 'meta.json'), JSON.stringify({
        styleVersion, ingestedAt: new Date().toISOString().slice(0, 10),
        sourceFile: file, sourceSize: `${meta.width}x${meta.height}`,
        frames: N, background: transparent ? 'alpha' : 'keyed-from-dark',
        cutsPx: cuts, nominalCutsPx: Array.from({ length: N - 1 }, (_, k) => (k + 1) * cellW),
        forcedCuts: forced, dividersErased: dividers, canvasWidthPx: canvasW,
        reclaimedInkPx: reclaimed, sharedElements: shared, centeringShiftsPx: shifts,
        mirroredFrames: [...mirrorFrames],
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
