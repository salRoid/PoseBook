#!/usr/bin/env node
// Read the gallery's saved review back into the repo.
//
//   npm run review                     picks up ~/Downloads/kinetic-review.json
//   npm run review -- <path>           an explicit file
//   npm run review -- --apply          ALSO delete every "redo" from the corpus,
//                                      so `npm run status` lists them as to-do
//
// The review file is committed to frames/review.json — a note about a figure
// is worth as much as the figure, and it is what tells the generating side WHY
// a strip was rejected. Notes merge across sessions (newest wins per key), so
// reviewing in several sittings never loses earlier comments.

import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const STORE = join(ROOT, 'frames', 'review.json');
const CORPUS = join(ROOT, 'frames', 'corpus');

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const src = argv.find((a) => !a.startsWith('--')) ?? join(homedir(), 'Downloads', 'kinetic-review.json');

if (!existsSync(src)) {
  console.error(`kinetic: no review file at ${src}\n  Open dist/gallery.html, add notes, click "save review →", then re-run.`);
  process.exit(1);
}

const incoming = JSON.parse(readFileSync(src, 'utf8'));
const items = incoming.items ?? incoming;
const store = existsSync(STORE) ? JSON.parse(readFileSync(STORE, 'utf8')) : { items: {} };

let added = 0, changed = 0;
for (const [key, rec] of Object.entries(items)) {
  const prev = store.items[key];
  if (!prev) added++;
  else if (JSON.stringify(prev) !== JSON.stringify(rec)) changed++;
  store.items[key] = { ...rec, reviewedAt: incoming.savedAt ?? new Date().toISOString() };
}
store.updatedAt = new Date().toISOString();
mkdirSync(dirname(STORE), { recursive: true });
writeFileSync(STORE, JSON.stringify(store, null, 1) + '\n');

const all = Object.entries(store.items);
const redo = all.filter(([, r]) => r.verdict === 'redo');
const keep = all.filter(([, r]) => r.verdict === 'ok');
const noted = all.filter(([, r]) => (r.note || '').trim());

console.log(`\n── kinetic · review ── from ${src}\n`);
console.log(`  merged: ${added} new, ${changed} updated · ${all.length} total on file\n`);
console.log(`  keep ${keep.length} · redo ${redo.length} · with notes ${noted.length}\n`);

if (noted.length) {
  console.log('NOTES:');
  for (const [k, r] of noted) {
    console.log(`  ${r.verdict === 'redo' ? '✗' : r.verdict === 'ok' ? '✓' : '·'} ${k}`);
    console.log(`      ${r.note.trim().replace(/\n/g, '\n      ')}`);
  }
  console.log('');
}

if (redo.length) {
  if (APPLY) {
    let removed = 0;
    for (const [k] of redo) {
      const [slug, sex] = k.split('--');
      const dir = join(CORPUS, slug, sex);
      if (existsSync(dir)) { rmSync(dir, { recursive: true, force: true }); removed++; }
    }
    console.log(`  --apply: removed ${removed} rejected strip(s) from the corpus — they now show as to-do in \`npm run status\`.\n`);
  } else {
    console.log(`  ${redo.length} marked redo. Re-run with --apply to remove them from the corpus so they re-enter the queue.\n`);
  }
}
console.log(`  saved to frames/review.json (committed — the note is why a strip was rejected)\n`);
