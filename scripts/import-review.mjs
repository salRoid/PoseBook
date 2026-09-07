#!/usr/bin/env node
// The gallery's exported JSON → frames/review.db → dist/briefs.json.
// This is the "automatic" loop: one command turns your notes into Codex's
// next prompt.
//
//   npm run import-review                 ~/Downloads/posebook-review.json
//   npm run import-review -- <path>
//   npm run import-review -- --apply      ALSO delete every "redo" from the
//                                         corpus, so it re-enters the queue
//
// What it does, in order:
//   1. every {verdict, note} → one new row in `reviews` (append-only — a
//      note is evidence for why a strip was rejected, never overwritten)
//   2. every {view, frames} → upsert into `movement_overrides` (the CURRENT
//      decision for that movement)
//   3. `npm run brief` regenerated — briefs for overridden movements now ask
//      for the new view/frame count, and briefs for "redo" slugs carry the
//      note as a correction: "The previous attempt was rejected: <note>."
//   4. `npm run status` re-derived so the corpus/plan mismatch is current
//
// A movement whose view or frame count changed is marked stale automatically
// (status.mjs already compares corpus frame count against the plan; a view
// change alone doesn't change frame count, so those are only caught by eye —
// which is exactly what re-reviewing the gallery after regeneration is for).

import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { openDb, applyReviewPayload } from './db.mjs';
import { backupFrameSet } from './frame-backup.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = join(ROOT, 'frames', 'corpus');

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
// Renamed Kinetic -> PoseBook on 2026-09-06: a review downloaded before the
// rename is still sitting in ~/Downloads under the old name, so fall back to
// it rather than reporting "no review file" at a reviewer who just saved one.
const DEFAULTS = ['posebook-review.json', 'kinetic-review.json'].map((f) => join(homedir(), 'Downloads', f));
const src = argv.find((a) => !a.startsWith('--')) ?? DEFAULTS.find(existsSync) ?? DEFAULTS[0];

if (!existsSync(src)) {
  console.error(`posebook: no review file at ${src}\n  Open dist/gallery.html, add notes, click "save review →", then re-run.`);
  process.exit(1);
}

const incoming = JSON.parse(readFileSync(src, 'utf8'));
const db = openDb();
const { reviewRows, overrideRows } = applyReviewPayload(db, { ...incoming, source: src });

console.log(`\n── posebook · import-review ── from ${src}\n`);
console.log(`  ${reviewRows.length} review row(s) logged · ${overrideRows.length} movement override(s) applied\n`);

const redo = db.prepare(`
  SELECT r.slug, r.sex, r.note FROM reviews r
  JOIN (SELECT slug, sex, MAX(id) AS max_id FROM reviews GROUP BY slug, sex) latest
    ON r.slug = latest.slug AND r.sex = latest.sex AND r.id = latest.max_id
  WHERE r.verdict = 'redo'
`).all();

if (redo.length) {
  console.log(`REDO (${redo.length}):`);
  for (const r of redo) console.log(`  ${r.slug}--${r.sex}  ${r.note ?? ''}`);
  console.log('');
  if (APPLY) {
    const backup = backupFrameSet(ROOT, redo, 'review-redo');
    console.log(`  backup: ${backup.dir}`);
    let removed = 0;
    for (const r of redo) {
      const dir = join(CORPUS, r.slug, r.sex);
      if (existsSync(dir)) { rmSync(dir, { recursive: true, force: true }); removed++; }
    }
    console.log(`  --apply: removed ${removed} rejected strip(s) from the corpus.\n`);
  } else {
    console.log(`  Re-run with --apply to remove these from the corpus so they re-enter the queue.\n`);
  }
}

if (overrideRows.length) {
  const rows = db.prepare(`SELECT slug, view, frames FROM movement_overrides ORDER BY updated_at DESC LIMIT ?`).all(overrideRows.length);
  console.log(`OVERRIDES applied:`);
  for (const r of rows) console.log(`  ${r.slug}  →  view: ${r.view ?? '(plan default)'}, frames: ${r.frames ?? '(plan default)'}`);
  console.log('');
}

db.close();

console.log('Regenerating dist/briefs.json with overrides + rejection notes…');
execFileSync('node', ['scripts/brief.mjs'], { cwd: ROOT, stdio: 'inherit' });
console.log('\nRegenerating status…');
execFileSync('node', ['scripts/status.mjs'], { cwd: ROOT, stdio: 'inherit' });
