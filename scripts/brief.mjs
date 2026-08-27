#!/usr/bin/env node
// Per-movement GENERATION BRIEFS — the whole-figure pipeline, ALL movements.
//
//   npm run brief                 write dist/briefs.json (every movement, both
//                                 bodies) + print a summary
//   npm run brief -- deadlift     print one movement's briefs in full
//   npm run brief -- --tier 2     print one plan tier
//
// ── THE SHAPE ──
// Every record carries its own `file`, its own fully-assembled `prompt`, its
// frame grammar and its references — the consumer never assembles anything,
// so it cannot assemble it differently (Foodsum's export rule). The style
// prefix is PARSED out of frames/STYLE.md at runtime; a paraphrased prefix
// across ~700 strips is permanent drift, so there is exactly one copy.
//
// ── POSE CONTROL, two tiers ──
// A movement with an authored pose carries its rig skeleton frames as the
// reference — match the joint positions exactly. A movement without one
// carries Health's own catalogue DESCRIPTION as pose guidance (user-visible
// text, not an invention) and is marked `ref: none`; the rig reference
// arrives when its pose is authored, and regenerating the brief picks it up.

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, currentReviews, currentOverrides } from './db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLAN = JSON.parse(readFileSync(join(ROOT, 'poses', 'PLAN.json'), 'utf8'));

// ── review feedback loop ─────────────────────────────────────────────────
// This is what makes review "automatic": an override changes what a brief
// ASKS for, and a rejection note travels into the NEXT prompt as a correction
// — the generating side sees exactly why the last attempt was rejected
// instead of guessing from a deleted file.
const _db = openDb();
const REVIEWS = currentReviews(_db);
const OVERRIDES = currentOverrides(_db);
_db.close();

// ── style contract, parsed never restated ───────────────────────────────────
const styleMd = readFileSync(join(ROOT, 'frames', 'STYLE.md'), 'utf8');
const styleVersion = (styleMd.match(/\*\*Style version: (v\d+)\.\*\*/) ?? [, 'v?'])[1];
const prefix = styleMd.split('## Fixed prefix (v1)')[1].split('##')[0].trim();
const FIGURE = {
  m: (styleMd.match(/- male: (.+)/) ?? [, 'male figure'])[1].trim(),
  f: (styleMd.match(/- female: (.+)/) ?? [, 'female figure'])[1].trim(),
};
if (!prefix || prefix.length < 40) throw new Error('frames/STYLE.md failed to parse — fix the file, do not hardcode a prefix');

// Frame grammar is DISCIPLINE-SPECIFIC: a lift's frames are phases of one
// repetition; an asana's are the entry and the full expression, which is a
// different instruction and must not be described as "the effort position".
const FRAME_MEANING = {
  strength: {
    1: 'a single frame: the held position',
    2: 'two frames side by side in one image, equal square cells: frame 1 the start position, frame 2 the effort/end position',
    3: 'three frames side by side in one image, equal square cells: frame 1 the start position, frame 2 the mid-movement position, frame 3 the effort/end position',
  },
  yoga: {
    1: 'a single frame: the pose held in its full expression',
    2: 'two frames side by side in one image, equal square cells: frame 1 the entry into the pose, frame 2 the full expression of the pose',
    3: 'three frames side by side in one image, equal square cells: the three stages of the movement in order',
  },
};

const argv = process.argv.slice(2);
const tierIdx = argv.indexOf('--tier');
const tier = tierIdx >= 0 ? Number(argv[tierIdx + 1]) : null;
const only = argv.find((a) => !a.startsWith('--') && a !== String(tier));

const briefs = [];
let overriddenCount = 0, correctionCount = 0;
for (const r of PLAN) {
  const ov = OVERRIDES.get(r.slug);
  const view = ov?.view ?? r.view;
  const frames = ov?.frames ?? r.frames;
  const isOverridden = !!(ov?.view || ov?.frames);
  if (isOverridden) overriddenCount++;

  for (const sex of ['m', 'f']) {
    const refDir = join(ROOT, 'dist', 'svg', r.slug, sex);
    const refs = existsSync(refDir)
      ? readdirSync(refDir).filter((f) => f.endsWith('.svg')).map((f) => `dist/svg/${r.slug}/${sex}/${f}`)
      : [];
    const feet = r.discipline === 'yoga' ? 'bare feet' : 'wearing low training shoes';
    const prop = r.prop ? `, with a ${r.prop.replace(/-/g, ' ')}` : '';
    const poseGuide = refs.length
      ? 'Match the joint positions of the attached skeleton reference frames exactly.'
      : `Movement guidance: ${r.description}`;

    // A rejected strip's note becomes a CORRECTION on its next brief — the
    // whole point of reading review back in: Codex sees why it failed, not
    // just that it must try again.
    const rv = REVIEWS.get(`${r.slug}--${sex}`);
    let correction = '';
    if (rv?.verdict === 'redo') {
      correctionCount++;
      correction = rv.note && rv.note.trim()
        ? ` CORRECTION — the previous attempt was rejected: "${rv.note.trim()}". Do not repeat that.`
        : ' CORRECTION — the previous attempt was rejected on review; match the style contract exactly.';
    }

    briefs.push({
      slug: r.slug, sex, tier: r.tier, frames, view,
      overridden: isOverridden, redo: rv?.verdict === 'redo',
      styleVersion,
      file: `frames/inbox/${r.slug}--${sex}.png`,
      refs,
      prompt:
        `${prefix} ${FRAME_MEANING[r.discipline][frames] ?? FRAME_MEANING[r.discipline][3]} ` +
        `Subject: ${FIGURE[sex]}, ${feet}, performing ${r.name}${prop}, ${view} view. ${poseGuide}${correction}`,
    });
  }
}

mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist', 'briefs.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), styleVersion,
  anchor: 'deadlift--m',
  note: 'Generate the anchor FIRST and get it accepted; every later batch is checked against it. See frames/STYLE.md.',
  briefs,
}, null, 1) + '\n');

const withRef = briefs.filter((b) => b.refs.length).length;
if (only || tier) {
  for (const b of briefs) {
    if (only && b.slug !== only) continue;
    if (tier && b.tier !== tier) continue;
    console.log(`── ${b.slug}--${b.sex}  →  ${b.file}${b.refs.length ? '' : '   (no rig ref yet)'}`);
    console.log(`  ${b.prompt}\n${b.refs.length ? `  refs: ${b.refs.join(' · ')}\n` : ''}`);
  }
}
console.log(`briefs: ${briefs.length} written to dist/briefs.json (${withRef} with rig references, ${briefs.length - withRef} on catalogue descriptions) · style ${styleVersion} · anchor: deadlift--m first`);
if (overriddenCount) console.log(`  ${overriddenCount} movement(s) carry a view/frame override from review`);
if (correctionCount) console.log(`  ${correctionCount} brief(s) carry a rejection correction from review`);
