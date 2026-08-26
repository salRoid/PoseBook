#!/usr/bin/env node
// Per-movement GENERATION BRIEFS — the whole-figure pipeline.
//
//   npm run brief                 briefs for every movement with an authored pose
//   npm run brief -- squat        one movement
//   npm run brief -- --tier 2     a plan tier (needs poses authored first)
//
// ── THE PIVOT, and why ──
// Codex's whole-figure deadlift outclassed the part-assembled figures on
// sight: a model drawing the COMPLETE body renders anatomy in the context of
// the pose, which recombined context-free parts never can. And generating all
// frames of one movement IN ONE CANVAS makes within-movement consistency true
// by construction — dissolving the drift objection the parts detour was built
// on. What generation still gets wrong is the MOVEMENT itself (Health's
// ATTRIBUTION.md: sit-up drawn as a crunch), so the rig stays as the CONTROL:
// every brief carries the rig's skeleton frames as the pose reference, and
// review compares the generated figure against that geometry.
//
// The parts/manifest pipeline is NOT deleted: it is the runtime layer — the
// measurement-driven, tone-driven personal figure — a different product from
// catalogue art.

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PLAN = JSON.parse(readFileSync(join(ROOT, 'poses', 'PLAN.json'), 'utf8'));

const argv = process.argv.slice(2);
const tierIdx = argv.indexOf('--tier');
const tier = tierIdx >= 0 ? Number(argv[tierIdx + 1]) : null;
const only = argv.find((a) => !a.startsWith('--') && a !== String(tier));

const STYLE =
  'Bold hand-drawn white outline illustration on a fully TRANSPARENT background, ' +
  'single consistent line weight with slight sketch texture, anatomically defined ' +
  'musculature, no fill shading, no colour, no background, no text. ' +
  'One consistent visual system across every frame and every exercise.';

const FRAME_MEANING = {
  1: 'the held position',
  2: 'frame 1 the start position, frame 2 the effort/end position',
  3: 'frame 1 the start position, frame 2 the mid-movement position, frame 3 the effort/end position',
};

let printed = 0;
for (const r of PLAN) {
  if (only && r.slug !== only) continue;
  if (tier && r.tier !== tier) continue;
  const refDir = join(ROOT, 'dist', 'svg', r.slug);
  const hasRef = existsSync(refDir);
  if (!only && !tier && !hasRef) continue; // default: only pose-authored movements

  for (const sex of ['m', 'f']) {
    const refs = hasRef && existsSync(join(refDir, sex))
      ? readdirSync(join(refDir, sex)).filter((f) => f.endsWith('.svg')).map((f) => `dist/svg/${r.slug}/${sex}/${f}`)
      : [];
    const body = sex === 'm'
      ? 'male figure, athletic build'
      : 'female figure, athletic build, hair in a simple bun';
    const feet = r.discipline === 'yoga' ? 'bare feet' : 'wearing low training shoes';
    console.log(`── ${r.slug}--${sex}  →  frames/inbox/${r.slug}--${sex}.png`);
    console.log(`  ${r.frames} frame(s) side by side in ONE image, equal cells of 1024px, ${FRAME_MEANING[r.frames] ?? 'the movement phases in order'}.`);
    console.log(`  ${STYLE}`);
    console.log(`  Subject: ${body}, ${feet}, performing ${r.name}${r.prop ? `, with a ${r.prop.replace('-', ' ')}` : ''}, ${r.view} view.`);
    console.log(refs.length
      ? `  POSE REFERENCE (match these joint positions exactly): ${refs.join(' · ')}`
      : `  (no rig reference yet — pose must be authored in poses/ first for QA)`);
    console.log('');
    printed++;
  }
}
console.log(`${printed} brief(s). Generated strips land in frames/inbox/ as <slug>--<m|f>.png.`);
