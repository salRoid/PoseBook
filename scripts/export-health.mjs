#!/usr/bin/env node
// dist → Health/public/exercise-art/<slug>/frame-N.svg, the exact layout the
// everkinetic import produced and `ExerciseFigure` already renders.
//
//   npm run export                 copy every built slug that does NOT already exist
//   npm run export -- --sex f      ship the female figure instead (default m)
//   npm run export -- --force      overwrite slugs that already have art
//   npm run export -- --dry        say what would happen, write nothing
//
// ── IT NEVER CLOBBERS BY DEFAULT ──
// Nine of the workout slugs (squat, push-up, deadlift…) already carry
// everkinetic art in Health. Replacing a whole visual language one file at a
// time is how a card grid ends up half one style and half another, so an
// existing slug is SKIPPED and reported; `--force` is the deliberate act of
// replacement, taken per run, not per accident.
//
// ── ONE SEX PER SLUG, for now ──
// Health's renderer reads `<slug>/frame-N.svg` — it has no per-user body
// selection. Both figures are built and kept in dist/; teaching
// `ExerciseFigure` to pick m/f off the profile's existing `sex` field is a
// Health change, noted in the README, and this script re-runs in one command
// when it lands.

import { readdirSync, mkdirSync, copyFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'dist', 'svg');
const DEST = join(ROOT, '..', 'Health', 'public', 'exercise-art');

const argv = process.argv.slice(2);
const has = (f) => argv.includes(f);
const sex = argv[argv.indexOf('--sex') + 1] && argv.includes('--sex')
  ? argv[argv.indexOf('--sex') + 1] : 'm';
const FORCE = has('--force');
const DRY = has('--dry');

if (!existsSync(SRC)) {
  console.error('posebook: dist/svg missing — run `npm run build` first.');
  process.exit(1);
}

let copied = 0, skipped = 0;
for (const slug of readdirSync(SRC).sort()) {
  const from = join(SRC, slug, sex);
  if (!existsSync(from) || !statSync(from).isDirectory()) continue;
  const to = join(DEST, slug);
  if (existsSync(to) && !FORCE) {
    console.log(`  ~ ${slug}: already has art in Health — skipped (use --force to replace)`);
    skipped++;
    continue;
  }
  const frames = readdirSync(from).filter((f) => /^frame-\d+\.svg$/.test(f)).sort();
  if (!DRY) {
    mkdirSync(to, { recursive: true });
    for (const f of frames) copyFileSync(join(from, f), join(to, f));
  }
  console.log(`  ✓ ${slug}: ${frames.length} frame(s) (${sex})`);
  copied++;
}

console.log(`\nposebook: ${copied} slug(s) exported, ${skipped} skipped${DRY ? ' (dry run — nothing written)' : ''}`);
if (copied > 0 && !DRY) {
  console.log('Own art — no attribution obligation. Update Health/ATTRIBUTION.md if a\n' +
              'replaced slug used to credit everkinetic/Bryl Lim.');
}
