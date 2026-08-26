#!/usr/bin/env node
// THE POSE PLAN — every movement in Health's real catalogue (246 strength +
// 104 asanas), each with the frames, view, and equipment its figure needs.
// A PROJECTION of Health's `globalExercises.ts`, never a hand-kept list: the
// catalogue moves, this regenerates, nothing drifts (Foodsum's export rule).
//
//   npm run plan               summary + writes poses/PLAN.json, PLAN.md, dist/plan.html
//
// ── WHAT DECIDES WHAT ──
// frames  everkinetic's own convention: 2 for a movement (start → effort),
//         1 for a hold (planks, hangs, every asana), more only for a flow.
// view    side unless the movement is symmetric-facing (presses overhead,
//         lateral raises, pull-ups) or the pose family says otherwise.
// props   EQUIPMENT IS GEOMETRY, NEVER GENERATED ART: a prop is drawn by the
//         engine and anchored to solved joints (a barbell rides the wrists),
//         so it moves with every pose edit and cannot drift in style. The
//         plan derives each movement's prop from its name and reports which
//         props the engine already draws vs. which are still to build.
// tiers   1 = the user's own library with no art today (the real gap),
//         2 = every asana (no yoga art exists at all),
//         3 = remaining strength with no everkinetic art,
//         4 = covered by everkinetic — replacement is optional, per-slug.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const HEALTH = join(ROOT, '..', 'Health');

const { GLOBAL_EXERCISES } = await import(join(HEALTH, 'lib', 'globalExercises.ts'));
const { WORKOUT } = await import(join(ROOT, 'poses', 'workout.mjs'));
const { YOGA } = await import(join(ROOT, 'poses', 'yoga.mjs'));

// ── inputs ──────────────────────────────────────────────────────────────────
const BUILT = new Set([...WORKOUT, ...YOGA].map((e) => e.slug));

// everkinetic coverage, read the way Health itself resolves it: art dir per
// id, plus the ART_ALIAS remaps parsed out of exerciseArt.ts (not exported)
const artDirs = new Set(readdirSync(join(HEALTH, 'public', 'exercise-art')));
const artSrc = readFileSync(join(HEALTH, 'lib', 'exerciseArt.ts'), 'utf8');
const aliasBlock = artSrc.slice(artSrc.indexOf('const ART_ALIAS'), artSrc.indexOf('};', artSrc.indexOf('const ART_ALIAS')));
const ART_ALIAS = Object.fromEntries(
  [...aliasBlock.matchAll(/'([a-z0-9-]+)':\s*'([a-z0-9-]+)'/g)].map((m) => [m[1], m[2]]),
);
const hasArt = (id) => artDirs.has(id) || artDirs.has(ART_ALIAS[id] ?? '');

const userLib = new Set(
  existsSync(join(ROOT, 'poses', 'user-library.json'))
    ? JSON.parse(readFileSync(join(ROOT, 'poses', 'user-library.json'), 'utf8')).map((n) => n.toLowerCase())
    : [],
);

// ── heuristics ──────────────────────────────────────────────────────────────
// Engine props that EXIST vs. props the equipment sweep says are still needed.
const PROP_BUILT = new Set(['barbell', 'dumbbell', 'barbell-front', 'bench']);
const EQUIP = [
  [/smith|machine|pec deck|lat pulldown|leg press|leg extension|leg curl|hack squat|cable row|chest press/i, 'machine'],
  [/assault bike|air bike|\bbike\b|rower|rowing|treadmill|elliptical|ski erg|stair/i, 'cardio-machine'],
  [/cable|pulldown|pushdown|face pull|woodchop/i, 'cable'],
  [/pull-up|chin-up|hang|muscle-up|toes-to-bar|leg raise.*bar/i, 'pullup-bar'],
  [/dumbbell|db |farmer|suitcase|goblet/i, 'dumbbell'],
  [/barbell|deadlift|ez[- ]bar|landmine|good morning|rack pull|clean|snatch|hip thrust/i, 'barbell'],
  [/kettlebell|kb /i, 'kettlebell'],
  [/band|trx|ring/i, 'band'],
  [/\bbox\b|step-up|step up/i, 'box'],
  [/dip\b|bench/i, 'bench'],
  [/plate|sandbag|med(icine)? ball|slam ball|wall ball/i, 'weight-misc'],
  [/sled|prowler/i, 'sled'],
  [/rope(?! hammer)/i, 'rope'],
  [/wall/i, 'wall'],
];
const equipFor = (name) => (EQUIP.find(([re]) => re.test(name)) ?? [null, null])[1];

const FRONT_STRENGTH = /lateral raise|jumping jack|star jump|pull-up|chin-up|pulldown|overhead press|shoulder press|arnold press|upright row|jack/i;
// Poses whose canonical drawing is the OTHER view than their family default —
// a review list, not gospel; the pose author overrules per entry.
const YOGA_VIEW_OVERRIDES = {
  'yoga-virabhadrasana-1': 'side', 'yoga-utkatasana': 'side', 'yoga-virabhadrasana-3': 'side',
  'yoga-ardha-chandrasana': 'front', 'yoga-trikonasana': 'front', 'yoga-parsvakonasana': 'front',
  'yoga-garudasana': 'front', 'yoga-natarajasana': 'side', 'yoga-anjaneyasana': 'side',
};
const FRONT_FAMILIES = new Set(['standing', 'balance']);

const HOLD = /plank|hold|hang|wall sit|l-sit|superman|hollow|bird dog/i;
// Bryl's set — the art already in Health, and the quality bar — is THREE
// frames per movement (start / mid / effort), and ExerciseFigure ping-pongs
// whatever count it gets. New strength art matches that native rhythm.

function rowFor(e) {
  const yoga = e.discipline === 'yoga';
  const slug = yoga ? e.id.replace(/^yoga-/, '') : e.id;
  const view = yoga
    ? (YOGA_VIEW_OVERRIDES[e.id] ?? (FRONT_FAMILIES.has(e.family) ? 'front' : 'side'))
    : (FRONT_STRENGTH.test(e.name) ? 'front' : 'side');
  const frames = yoga
    ? (e.id === 'yoga-marjaryasana-bitilasana' || slug === 'cat-cow' ? 2 : 1)
    : (HOLD.test(e.name) ? 1 : 3);
  const prop = equipFor(e.name);
  const tier = userLib.has(e.name.toLowerCase()) && !hasArt(e.id) ? 1
    : yoga ? 2
    : !hasArt(e.id) ? 3 : 4;
  return {
    id: e.id, name: e.name, slug, discipline: yoga ? 'yoga' : 'strength',
    family: e.family ?? e.category, view, frames,
    prop, propStatus: prop ? (PROP_BUILT.has(prop) ? 'built' : 'todo') : null,
    tier, built: BUILT.has(slug), everkinetic: hasArt(e.id),
    ...(yoga && e.sanskrit ? { sanskrit: e.sanskrit } : {}),
  };
}

const rows = GLOBAL_EXERCISES.map(rowFor).sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));

// ── outputs ─────────────────────────────────────────────────────────────────
writeFileSync(join(ROOT, 'poses', 'PLAN.json'), JSON.stringify(rows, null, 1) + '\n');

const propTodo = {};
for (const r of rows) if (r.propStatus === 'todo') propTodo[r.prop] = (propTodo[r.prop] ?? 0) + 1;
const tierCount = [1, 2, 3, 4].map((t) => rows.filter((r) => r.tier === t));
const totalFrames = rows.reduce((a, r) => a + r.frames * 2, 0); // ×2 bodies
const builtCount = rows.filter((r) => r.built).length;

const TIER_LABEL = {
  1: 'Tier 1 — YOUR library, no art at all today',
  2: 'Tier 2 — every asana (yoga has no art)',
  3: 'Tier 3 — remaining strength without everkinetic art',
  4: 'Tier 4 — everkinetic-covered (replacement optional, per slug)',
};

const md = [`# The pose plan — GENERATED by \`npm run plan\`, do not hand-edit
Source: Health's \`globalExercises.ts\` (${rows.length} movements). Frames double for the two bodies: **${totalFrames} SVGs total** when complete; ${builtCount} movements built so far.

## Props still to build in the engine
${Object.entries(propTodo).sort((a, b) => b[1] - a[1]).map(([p, c]) => `- \`${p}\` — needed by ${c} movement(s)`).join('\n')}
`];
for (const t of [1, 2, 3, 4]) {
  md.push(`\n## ${TIER_LABEL[t]} (${tierCount[t - 1].length})\n`);
  md.push('| movement | slug | view | frames | prop | done |');
  md.push('|---|---|---|---|---|---|');
  for (const r of tierCount[t - 1]) {
    md.push(`| ${r.name}${r.sanskrit ? ` *(${r.sanskrit})*` : ''} | \`${r.slug}\` | ${r.view} | ${r.frames} | ${r.prop ? `${r.prop}${r.propStatus === 'todo' ? ' ⚠' : ''}` : '—'} | ${r.built ? '✓' : ''} |`);
  }
}
writeFileSync(join(ROOT, 'PLAN.md'), md.join('\n') + '\n');

// a viewable copy beside the contact sheet
mkdirSync(join(ROOT, 'dist'), { recursive: true });
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
writeFileSync(join(ROOT, 'dist', 'plan.html'), `<!doctype html><meta charset="utf-8"><title>Kinetic — pose plan</title>
<style>body{font:14px/1.5 -apple-system,system-ui;margin:24px auto;max-width:960px;color:#161a19}
h2{margin:30px 0 8px;font-size:16px} table{border-collapse:collapse;width:100%;font-size:13px}
td,th{border-bottom:1px solid #e5e7e6;padding:5px 8px;text-align:left} th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#666}
code{background:#f2f4f3;padding:1px 5px;border-radius:5px} .warn{color:#b8630b} .ok{color:#127a63;font-weight:700}
.sum{background:#f6f8f7;border:1px solid #e5e7e6;border-radius:10px;padding:14px 18px}</style>
<h1>Kinetic — the pose plan</h1>
<div class="sum"><b>${rows.length} movements</b> from Health's catalogue → <b>${totalFrames} SVGs</b> when complete (frames × both bodies). Built: ${builtCount}. Props to add: ${Object.keys(propTodo).map((p) => `<code>${p}</code>`).join(' ')}</div>
${[1, 2, 3, 4].map((t) => `<h2>${esc(TIER_LABEL[t])} (${tierCount[t - 1].length})</h2>
<table><tr><th>movement</th><th>slug</th><th>view</th><th>frames</th><th>prop</th><th>done</th></tr>
${tierCount[t - 1].map((r) => `<tr><td>${esc(r.name)}${r.sanskrit ? ` <i>(${esc(r.sanskrit)})</i>` : ''}</td><td><code>${r.slug}</code></td><td>${r.view}</td><td>${r.frames}</td><td>${r.prop ? `${r.prop}${r.propStatus === 'todo' ? ' <span class="warn">⚠ to build</span>' : ''}` : '—'}</td><td>${r.built ? '<span class="ok">✓</span>' : ''}</td></tr>`).join('\n')}</table>`).join('\n')}
`);

console.log(`kinetic plan: ${rows.length} movements → ${totalFrames} SVGs (× both bodies)`);
for (const t of [1, 2, 3, 4]) console.log(`  tier ${t}: ${tierCount[t - 1].length}  (${TIER_LABEL[t].split('—')[1].trim()})`);
console.log(`  props to build: ${Object.entries(propTodo).map(([p, c]) => `${p}(${c})`).join(' ')}`);
console.log('  → poses/PLAN.json · PLAN.md · dist/plan.html');
