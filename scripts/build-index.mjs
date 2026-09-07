#!/usr/bin/env node
// frames/corpus/** → frames/corpus/index.json — the manifest Health imports.
//
// ── WHY A MANIFEST AND NOT A DIRECTORY LISTING ──────────────────────────────
// A consumer needs ONE thing it cannot see from a URL: how many frames this
// movement has. The corpus is not uniform — 233 movements have 3 frames, 40
// have 2 and 76 have 1 (a held asana is one position; there is no rep to draw)
// — and a renderer that assumes 3 requests `frame-2.svg` and `frame-3.svg` for
// a quarter of the corpus and gets 404s. Guessing from the id is worse: the
// count is a property of the DRAWING, not of the movement's name.
//
// Health imports this file at BUILD time (`@suite/posebook/index.json`) while
// fetching the SVGs at RUNTIME from wherever `NEXT_PUBLIC_POSEBOOK_BASE`
// points. That split is deliberate and mirrors Foodsum: the manifest is ~20 KB
// and must be in step with the code that reads it, so it rides in the bundle;
// the 1716 SVGs are 135 MB and must not.
//
// The count is read off DISK, never off meta.json's `frames` field — meta
// records what the ingest INTENDED, and the file that exists is what a browser
// can actually fetch. They have agreed every time so far; if they ever stop,
// the truth is the directory.
//
//   npm run index

import { readdirSync, existsSync, statSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = join(ROOT, 'frames', 'corpus');
const OUT = join(CORPUS, 'index.json');

const SEXES = ['m', 'f'];
const movements = {};
let frameTotal = 0;
const warnings = [];

for (const slug of readdirSync(CORPUS).sort()) {
  const dir = join(CORPUS, slug);
  if (!statSync(dir).isDirectory()) continue;      // skips index.json, .DS_Store
  const entry = {};
  for (const sex of SEXES) {
    const sd = join(dir, sex);
    if (!existsSync(sd) || !statSync(sd).isDirectory()) continue;
    const frames = readdirSync(sd).filter((f) => /^frame-\d+\.svg$/.test(f));
    if (!frames.length) continue;
    // Frames must be CONTIGUOUS from 1 — the renderer counts, it does not probe.
    const ns = frames.map((f) => Number(f.match(/\d+/)[0])).sort((a, b) => a - b);
    if (ns.some((n, i) => n !== i + 1)) {
      warnings.push(`${slug}/${sex}: non-contiguous frames [${ns.join(',')}]`);
      continue;
    }
    entry[sex] = ns.length;
    frameTotal += ns.length;
  }
  if (!Object.keys(entry).length) { warnings.push(`${slug}: no frames at all — skipped`); continue; }
  // Both figures are drawn for every movement. One missing is not fatal (the
  // consumer falls back to the other sex) but it IS a corpus gap worth naming.
  for (const sex of SEXES) if (entry[sex] === undefined) warnings.push(`${slug}: no '${sex}' figure`);
  movements[slug] = entry;
}

const style = (() => {
  const any = Object.keys(movements)[0];
  const s = any && SEXES.find((x) => movements[any][x]);
  try { return JSON.parse(readFileSync(join(CORPUS, any, s, 'meta.json'), 'utf8')).styleVersion; }
  catch { return null; }
})();

const index = {
  generatedAt: new Date().toISOString().slice(0, 10),
  styleVersion: style,
  canvas: 512,           // every frame; asserted by scripts/ingest-frames.mjs
  movements,
};

writeFileSync(OUT, JSON.stringify(index, null, 2) + '\n');

const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
for (const e of Object.values(movements)) for (const n of Object.values(e)) counts[n]++;
console.log(`posebook: ${Object.keys(movements).length} movements, ${frameTotal} frames → frames/corpus/index.json`);
console.log(`  figures by frame count: ${Object.entries(counts).filter(([, v]) => v).map(([k, v]) => `${v}×${k}f`).join('  ')}`);
if (warnings.length) {
  console.log(`\n  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`   ! ${w}`);
}
