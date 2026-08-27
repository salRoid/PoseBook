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
const INBOX = join(ROOT, 'frames', 'inbox');
const CORPUS = join(ROOT, 'frames', 'corpus');
const DRY = process.argv.includes('--dry');
const CELL = 512;

let sharp;
try { ({ default: sharp } = await import('sharp')); }
catch { console.error('kinetic: sharp is not resolvable — run npm install at the workspace root.'); process.exit(1); }

const PLAN = JSON.parse(readFileSync(join(ROOT, 'poses', 'PLAN.json'), 'utf8'));
const BYSLUG = new Map(PLAN.map((r) => [r.slug, r]));
const styleVersion = (readFileSync(join(ROOT, 'frames', 'STYLE.md'), 'utf8')
  .match(/\*\*Style version: (v\d+)\.\*\*/) ?? [, 'v?'])[1];

mkdirSync(INBOX, { recursive: true });
const files = readdirSync(INBOX)
  .filter((f) => !f.startsWith('.') && f !== 'done' && statSync(join(INBOX, f)).isFile())
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

    let img = sharp(join(INBOX, file));
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

    // split → downscale → wrap; all frames encoded before anything is written
    const cellW = Math.floor(info.width / N);
    const outs = [];
    for (let i = 0; i < N; i++) {
      const png = await sharp(strip, { raw: { width: info.width, height: info.height, channels: 4 } })
        .extract({ left: i * cellW, top: 0, width: cellW, height: info.height })
        .resize(CELL, CELL, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toBuffer();
      outs.push(
        `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${CELL} ${CELL}" width="${CELL}" height="${CELL}">` +
        `<image width="${CELL}" height="${CELL}" href="data:image/png;base64,${png.toString('base64')}"/></svg>\n`,
      );
    }

    const dir = join(CORPUS, slug, sex);
    const kb = (outs.reduce((a, s2) => a + s2.length, 0) / 1024).toFixed(0);
    console.log(`  ✓ ${file}  →  ${N} frame(s), ${kb}KB total`);
    if (!DRY) {
      mkdirSync(dir, { recursive: true });
      outs.forEach((svg, i) => writeFileSync(join(dir, `frame-${i + 1}.svg`), svg));
      writeFileSync(join(dir, 'meta.json'), JSON.stringify({
        styleVersion, ingestedAt: new Date().toISOString().slice(0, 10),
        sourceFile: file, sourceSize: `${meta.width}x${meta.height}`,
        frames: N, background: transparent ? 'alpha' : 'keyed-from-dark',
      }, null, 2) + '\n');
      mkdirSync(join(INBOX, 'done'), { recursive: true });
      renameSync(join(INBOX, file), join(INBOX, 'done', file));
    }
    ok++;
  } catch (err) {
    failures.push(file);
    console.log(`  ✗ ${file}\n      ${err.message}`);
  }
}

console.log(`\n  ${ok} ingested, ${failures.length} rejected${DRY ? ' (dry run — nothing written)' : ''}. LOOK at every frame before export — a wrong movement is the failure this pipeline exists to stop.\n`);
if (failures.length) process.exit(1);
