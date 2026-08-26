#!/usr/bin/env node
// poses → dist/svg/<slug>/<m|f>/frame-N.svg, plus a contact sheet to judge the
// whole set at once. Pure function of the pose files; dist/ is disposable.
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { readFileSync, existsSync } from 'node:fs';
import { renderExercise } from '../src/engine.mjs';
import { WORKOUT } from '../poses/workout.mjs';
import { YOGA } from '../poses/yoga.mjs';
import { PARTS } from '../parts/spec.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');
const only = process.argv[2]; // optional slug filter while tuning a pose

rmSync(join(DIST, 'svg'), { recursive: true, force: true });

const ALL = [
  ...WORKOUT.map((e) => ({ ...e, category: 'workout' })),
  ...YOGA.map((e) => ({ ...e, category: 'yoga' })),
];

const cells = [];
let files = 0;

for (const ex of ALL) {
  if (only && ex.slug !== only) continue;
  for (const sex of ['m', 'f']) {
    const svgs = renderExercise(ex, sex);
    const dir = join(DIST, 'svg', ex.slug, sex);
    mkdirSync(dir, { recursive: true });
    svgs.forEach((svg, i) => {
      writeFileSync(join(dir, `frame-${i + 1}.svg`), svg);
      files++;
    });
    cells.push({ slug: ex.slug, name: ex.name, category: ex.category, sex, svgs });
  }
}

// ── contact sheet ───────────────────────────────────────────────────────────
// ── the parts gallery: every manifest part, drawn with its ANCHOR DOTS ──────
// the dots are the QA affordance: a dot off the joint is a part that will
// assemble dislocated, visible here before it costs a build
const MANIFEST_PATH = join(ROOT, 'parts', 'manifest.json');
const manifest = existsSync(MANIFEST_PATH) ? JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) : {};
const partCards = Object.entries(manifest).map(([key, r]) => `
  <div class="pcard"><svg viewBox="0 0 ${r.w} ${r.h}"><path d="${r.d}" fill="currentColor" fill-rule="evenodd"/>
  <circle cx="${r.a[0]}" cy="${r.a[1]}" r="14" fill="#e0442c"/><circle cx="${r.b[0]}" cy="${r.b[1]}" r="14" fill="#127a63"/></svg>
  <div class="pname">${key}</div></div>`).join('');

// skin tones are a RENDER-TIME palette over colourless parts — three tones of
// the same frame, zero extra assets. This is what makes tone user-selectable.
const TONES = [
  { name: 'deep',  skin: '#8D5524', gear: '#3a3f3e' },
  { name: 'tan',   skin: '#C68642', gear: '#3a3f3e' },
  { name: 'light', skin: '#E7B58C', gear: '#3a3f3e' },
];
const demoEx = ALL.find((e) => e.slug === 'squat');
const toneCells = demoEx ? TONES.map((t) =>
  `<div class="pcard"><svg viewBox="0 0 512 512">${renderExercise(demoEx, 'm', { palette: t })[1].replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</svg><div class="pname">${t.name} · ${t.skin}</div></div>`).join('') : '';

const sheet = `<!doctype html><meta charset="utf-8"><title>Kinetic — contact sheet</title>
<style>
  body{font:14px/1.45 -apple-system,system-ui;margin:24px;background:#f4f5f4;color:#161a19}
  h1{font-size:20px} h2{font-size:15px;margin:28px 0 10px;text-transform:uppercase;letter-spacing:.08em;color:#666}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}
  .card{background:#fff;border:1px solid #e3e5e4;border-radius:12px;padding:12px}
  .frames{display:flex;gap:6px}
  .frames svg{flex:1;min-width:0;background:#fafbfa;border-radius:8px;color:#1c211f}
  .meta{display:flex;justify-content:space-between;margin-top:8px;font-size:12px;color:#555}
  .sex{font-weight:700}
  .pgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:10px}
  .pcard{background:#fff;border:1px solid #e3e5e4;border-radius:10px;padding:8px;text-align:center}
  .pcard svg{width:100%;height:110px;color:#1c211f}
  .pname{font-size:10px;color:#666;margin-top:4px;word-break:break-all}
  .legend{font-size:12px;color:#666;margin:6px 0 10px}
</style>
<h1>Kinetic — every exercise, both figures, every frame</h1>
<h2>the part library (${Object.keys(manifest).length} ingested)</h2>
<div class="legend"><span style="color:#e0442c">●</span> anchor A (proximal joint) · <span style="color:#127a63">●</span> anchor B (distal joint) — a dot off the joint = a part that will assemble dislocated</div>
<div class="pgrid">${partCards}</div>
<h2>build — the same figure driven by MEASUREMENTS (width 0.85 / 1.0 / 1.25)</h2>
<div class="pgrid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${demoEx ? [0.85, 1.0, 1.25].map((w) =>
  `<div class="pcard"><svg viewBox="0 0 512 512">${renderExercise(demoEx, 'm', { build: { width: w } })[0].replace(/^<svg[^>]*>/, '').replace('</svg>', '')}</svg><div class="pname">width ×${w}</div></div>`).join('') : ''}</div>
<h2>skin tone — a render-time palette, not extra assets</h2>
<div class="pgrid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))">${toneCells}</div>
${['workout', 'yoga'].map((cat) => `
<h2>${cat}</h2>
<div class="grid">
${cells.filter((c) => c.category === cat).map((c) => `
  <div class="card">
    <div class="frames">${c.svgs.join('')}</div>
    <div class="meta"><span>${c.name}</span><span class="sex">${c.sex === 'm' ? '♂' : '♀'}</span></div>
  </div>`).join('')}
</div>`).join('')}
`;
writeFileSync(join(DIST, 'sheet.html'), sheet);

console.log(`kinetic: ${files} frames written, sheet at dist/sheet.html`);
