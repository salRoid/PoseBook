#!/usr/bin/env node
// Where the corpus stands against the plan — the queue's progress report.
//
//   npm run status            counts + what is stale + what is next
//   npm run status -- --list  name every outstanding brief
//
// STALE is the point of this script. A strip generated against an older plan
// (wrong frame count) or an older style version is not "done" — it is a file
// that will animate wrong or look different from its neighbours, and at 700
// strips nobody can spot either by eye. Reported explicitly so exactly those
// are regenerated and nothing correct is thrown away.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = join(ROOT, 'frames', 'corpus');
const { styleVersion, briefs } = JSON.parse(readFileSync(join(ROOT, 'dist', 'briefs.json'), 'utf8'));
const LIST = process.argv.includes('--list');

const done = [], stale = [], todo = [];
for (const b of briefs) {
  const dir = join(CORPUS, b.slug, b.sex);
  if (!existsSync(dir)) { todo.push(b); continue; }
  const frames = readdirSync(dir).filter((f) => /^frame-\d+\.svg$/.test(f)).length;
  let meta = {};
  try { meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8')); } catch { /* no sidecar */ }
  const why = [];
  if (frames !== b.frames) why.push(`has ${frames} frame(s), plan wants ${b.frames}`);
  if (meta.styleVersion && meta.styleVersion !== styleVersion) why.push(`style ${meta.styleVersion} ≠ ${styleVersion}`);
  if (why.length) stale.push({ ...b, why: why.join(' · ') });
  else done.push(b);
}

const byTier = (arr) => [1, 2, 3, 4].map((t) => arr.filter((b) => b.tier === t).length).join(' / ');

console.log(`\n── kinetic · frames status ── style ${styleVersion} ──\n`);
console.log(`  done     ${String(done.length).padStart(4)}   (tiers 1/2/3/4: ${byTier(done)})`);
console.log(`  STALE    ${String(stale.length).padStart(4)}   regenerate these — see below`);
console.log(`  to do    ${String(todo.length).padStart(4)}   (tiers 1/2/3/4: ${byTier(todo)})`);
console.log(`  ─────────────\n  total    ${String(briefs.length).padStart(4)}   ${(done.length / briefs.length * 100).toFixed(1)}% complete\n`);

if (stale.length) {
  console.log('STALE — delete frames/corpus/<slug>/<sex>/ and regenerate from the brief:');
  for (const b of stale.slice(0, LIST ? 1e9 : 12)) console.log(`  ${b.slug}--${b.sex}  ${b.why}`);
  if (!LIST && stale.length > 12) console.log(`  …and ${stale.length - 12} more (--list for all)`);
  console.log('');
}
if (LIST && todo.length) {
  console.log('OUTSTANDING:');
  for (const b of todo) console.log(`  ${b.slug}--${b.sex}  tier ${b.tier}  ${b.frames} frame(s)`);
  console.log('');
}
if (!LIST && todo.length) {
  const next = todo[0];
  console.log(`NEXT: ${next.file}\n  ${next.prompt}\n`);
}
