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
const PATTERN_REFS = {
  m: ['frames/inbox/done/close-grip-dumbbell-press--m.png'],
  f: [
    'frames/inbox/done/close-grip-dumbbell-press--m.png',
    'frames/inbox/done/dumbbell-clean-and-press--f.png',
  ],
};
if (!prefix || prefix.length < 40) throw new Error('frames/STYLE.md failed to parse — fix the file, do not hardcode a prefix');

// ── hard exclusions, TRANSMITTED ────────────────────────────────────────────
// These used to be parsed by nothing. STYLE.md forbade borders, backgrounds
// and filled bodies, but only the fixed prefix ever reached the model, so the
// exclusions were a promise to ourselves — and the corpus duly came back with
// border boxes ("Why is there a white border box"), drawn checkerboards
// ("Pixelated background") and solid white bodies ("The body has gone too
// white"), which together account for most rejections in frames/review.db.
// Appending them makes the contract enforceable at the point it is used.
//
// The style VERSION deliberately stays v1: the accepted anchor look does not
// change, and bumping it would mark all 131 ingested strips stale for a
// clarification rather than a restyle. What changes is that rules already in
// contract v1 are now actually stated to the generator.
// Bullets WRAP across lines in the markdown, so the block is split on the
// list markers, not on newlines — filtering for lines that start with "- "
// silently truncates every bullet at its first line, which turns a rule into
// a sentence fragment ("The figure is drawn in OUTLINE: contour lines plus").
const exclusions = (styleMd.split('## Hard exclusions')[1] ?? '').split('\n## ')[0]
  .split(/\n- /).slice(1)
  .map((l) => l.replace(/\*\*/g, '')
    .replace(/\s*\(Review rejections?:[\s\S]*?\)/g, '')   // review provenance is for humans
    .replace(/\s*\(Rejections?:[\s\S]*?\)/g, '')
    .replace(/\s+/g, ' ').trim())
  .filter(Boolean);
if (exclusions.length < 5) throw new Error('frames/STYLE.md: Hard exclusions failed to parse — the prompt would silently lose them');
const NEVER = `Hard exclusions, all mandatory: ${exclusions.join('; ')}.`;

// Frame grammar is DISCIPLINE-SPECIFIC: a lift's frames are phases of one
// repetition; an asana's are the entry and the full expression, which is a
// different instruction and must not be described as "the effort position".
const FRAME_MEANING = {
  strength: {
    1: 'one pose centered on a square canvas: the held position',
    2: 'two sequential poses side by side on one continuous 2:1 canvas: the left pose is the start position and the right pose is the effort/end position',
    3: 'three sequential poses side by side on one continuous 3:1 canvas: the left pose is the start position, the middle pose is the mid-movement position, and the right pose is the effort/end position',
  },
  yoga: {
    1: 'one pose centered on a square canvas: the pose held in its full expression',
    2: 'two sequential poses side by side on one continuous 2:1 canvas: the left pose is the entry into the pose and the right pose is the full expression of the pose',
    3: 'three sequential poses side by side on one continuous 3:1 canvas: the three stages of the movement appear in order from left to right',
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
      const note = rv.note?.trim() ?? '';
      const lower = note.toLowerCase();
      if (lower.includes('completely white') || lower.includes('too white') || lower.includes('extra white')) {
        correction = ' CORRECTION — use only narrow contour and detail strokes, keeping uniform black open regions between every stroke.';
      } else if (lower.includes('pixelated background') || (lower.includes('pix') && lower.includes('background'))) {
        correction = ' CORRECTION — keep the entire background uniformly solid black.';
      } else if (lower.includes('cut off') || lower.includes('cropped')) {
        correction = ' CORRECTION — keep the complete figure and every implement visible with clear margin on all four sides.';
      } else if (lower.includes('border') || lower.includes('divider')) {
        correction = ' CORRECTION — place the sequential poses on one uninterrupted continuous black canvas.';
      } else if (lower.includes('shorts')) {
        correction = ' CORRECTION — clearly depict athletic shorts with narrow contour and clothing-detail strokes.';
      } else if (lower.includes('both knees') && lower.includes('plough pose')) {
        correction = ' CORRECTION — in the right pose, bend both knees until they touch the floor directly beside the ears.';
      } else {
        correction = note
          ? ` CORRECTION — the previous attempt was rejected: "${note}". Do not repeat that.`
          : ' CORRECTION — the previous attempt was rejected on review; match the style contract exactly.';
      }
    }

    briefs.push({
      slug: r.slug, sex, tier: r.tier, frames, view,
      overridden: isOverridden, redo: rv?.verdict === 'redo',
      styleVersion,
      file: `frames/inbox/${r.slug}--${sex}.png`,
      patternRefs: PATTERN_REFS[sex],
      refs,
      prompt:
        `${prefix} ${FRAME_MEANING[r.discipline][frames] ?? FRAME_MEANING[r.discipline][3]} ` +
        `Subject: ${FIGURE[sex]}, ${feet}, performing ${r.name}${prop}, ${view} view. ${poseGuide}${correction} ${NEVER}`,
    });
  }
}

mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist', 'briefs.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), styleVersion,
  anchor: 'deadlift--m',
  approvedPattern: PATTERN_REFS,
  note: 'Generate the anchor FIRST and get it accepted; every later batch is checked against the user-approved pattern references and anchor. See frames/STYLE.md.',
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
