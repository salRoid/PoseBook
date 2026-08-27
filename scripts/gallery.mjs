#!/usr/bin/env node
// dist/gallery.html — every ingested movement, ANIMATED, self-contained.
//
//   npm run gallery
//
// The frames are white ink on transparency, so the page is dark by necessity,
// not by taste. Playback mirrors Health's own `ExerciseFigure`: frames
// ping-pong 1→2→3→2 over a fixed rep duration (ART_REP_MS = 2080ms), so a
// 2-frame movement and a 3-frame movement complete a rep together instead of
// running at two speeds side by side — the trap Health hit and documented.
//
// Previews are downscaled and inlined as data URIs: the real corpus is 8MB
// and a review page that cannot be opened is not a review page.

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, currentReviews, currentOverrides } from './db.mjs';

const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = join(ROOT, 'frames', 'corpus');
const PREVIEW = 260;
const REP_MS = 2080;

const PLAN = JSON.parse(readFileSync(join(ROOT, 'poses', 'PLAN.json'), 'utf8'));
const BYSLUG = new Map(PLAN.map((r) => [r.slug, r]));

// Prior review state, so a reopened gallery shows what was already decided
// instead of asking the reviewer to redo work every time the page rebuilds.
const db = openDb();
const REVIEWS = currentReviews(db);
const OVERRIDES = currentOverrides(db);
db.close();

const items = [];
if (existsSync(CORPUS)) {
  for (const slug of readdirSync(CORPUS).sort()) {
    const sdir = join(CORPUS, slug);
    if (!statSync(sdir).isDirectory()) continue;
    for (const sex of readdirSync(sdir)) {
      const dir = join(sdir, sex);
      if (!statSync(dir).isDirectory()) continue;
      const files = readdirSync(dir).filter((f) => /^frame-\d+\.svg$/.test(f))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
      if (!files.length) continue;

      const frames = [];
      for (const f of files) {
        // the SVG wraps a base64 PNG — decode, downscale, re-inline
        const svg = readFileSync(join(dir, f), 'utf8');
        const m = svg.match(/base64,([^"]+)"/);
        const buf = m ? Buffer.from(m[1], 'base64') : Buffer.from(svg);
        const png = await sharp(buf).resize(PREVIEW, PREVIEW, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png({ compressionLevel: 9, quality: 80 }).toBuffer();
        frames.push(`data:image/png;base64,${png.toString('base64')}`);
      }
      const plan = BYSLUG.get(slug) ?? {};
      const ov = OVERRIDES.get(slug);
      const wantFrames = ov?.frames ?? plan.frames ?? frames.length;
      const wantView = ov?.view ?? plan.view ?? 'side';
      const rv = REVIEWS.get(`${slug}--${sex}`);
      items.push({
        slug, sex, frames,
        name: plan.name ?? slug,
        discipline: plan.discipline ?? 'strength',
        want: wantFrames,
        view: wantView,
        planView: plan.view ?? 'side',
        stale: wantFrames !== frames.length,
        verdict: rv?.verdict ?? null,
        note: rv?.note ?? '',
      });
    }
  }
}

const strength = items.filter((i) => i.discipline === 'strength');
const yoga = items.filter((i) => i.discipline === 'yoga');
const totalBriefs = PLAN.length * 2;

// Every card carries its own review controls. The key is `<slug>--<sex>`,
// which is the same id the briefs, the corpus and `npm run status` use — so a
// note written here addresses exactly one regeneratable unit. View/frames are
// a MOVEMENT property (both bodies share a viewpoint), so those two controls
// are keyed on the slug alone and appear once per movement, on its FIRST
// card, rather than duplicated per sex — changing it there updates both.
const VIEWS = ['side', 'front', 'back', '34'];
const viewLabel = { side: 'Side', front: 'Front', back: 'Back', '34': 'Three-quarter' };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const card = (it, i, showMovementControls) => `
  <figure class="c${it.stale ? ' stale' : ''}" data-i="${i}" data-key="${it.slug}--${it.sex}" data-slug="${it.slug}"
          data-verdict="${it.verdict ?? ''}" data-note="${esc(it.note)}" data-view="${it.view}" data-stale="${it.stale ? '1' : '0'}">
    <div class="stage">${it.frames.map((d, k) => `<img src="${d}" alt="" class="${k === 0 ? 'on' : ''}">`).join('')}</div>
    <figcaption>
      <span class="nm">${it.name}</span>
      <span class="sx">${it.sex === 'm' ? '♂' : '♀'}</span>
    </figcaption>
    <div class="sub" data-plan-view="${it.planView}">${it.frames.length} frame${it.frames.length > 1 ? 's' : ''} · ${viewLabel[it.view] ?? it.view}${it.stale ? ` · STALE, plan wants ${it.want}` : ''}${it.view !== it.planView ? ` · view overridden (plan: ${viewLabel[it.planView]})` : ''}</div>
    <div class="rv">
      <div class="vbtns">
        <button class="v ok"   data-v="ok">keep</button>
        <button class="v redo" data-v="redo">redo</button>
      </div>
      <textarea class="note" rows="2" placeholder="what's wrong / what to change…"></textarea>
      ${showMovementControls ? `
      <div class="mv">
        <label>View <select class="ov-view">${VIEWS.map((v) => `<option value="${v}"${v === it.view ? ' selected' : ''}>${viewLabel[v]}</option>`).join('')}</select></label>
        <label>Frames <select class="ov-frames">${[1, 2, 3, 4].map((n) => `<option value="${n}"${n === it.want ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>` : ''}
    </div>
  </figure>`;

const html = `<!doctype html><meta charset="utf-8"><title>Kinetic — what exists so far</title>
<style>
 :root{--bg:#101413;--panel:#171d1c;--line:#232b29;--ink:#e8edeb;--dim:#8a9693;--ok:#4FD6AE;--warn:#e0a33a}
 *{box-sizing:border-box}
 body{margin:0;padding:28px;background:var(--bg);color:var(--ink);
      font:14px/1.5 -apple-system,system-ui,sans-serif}
 h1{font-size:22px;margin:0 0 4px} h2{font-size:13px;letter-spacing:.1em;text-transform:uppercase;
      color:var(--dim);margin:34px 0 12px;font-weight:700}
 .lede{color:var(--dim);margin:0 0 18px}
 .bar{height:8px;border-radius:99px;background:var(--line);overflow:hidden;max-width:560px}
 .bar i{display:block;height:100%;background:var(--ok)}
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
 .c{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:12px;
     display:flex;flex-direction:column}
 .c.stale{border-color:var(--warn)}
 .stage{position:relative;aspect-ratio:1;background:#0c100f;border-radius:10px;overflow:hidden}
 .stage img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;transition:opacity .12s linear}
 .stage img.on{opacity:1}
 figcaption{display:flex;justify-content:space-between;gap:8px;margin-top:9px;font-size:13px}
 .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .sx{color:var(--dim)}
 .sub{color:var(--dim);font-size:11px;margin-top:2px}
 .c.stale .sub{color:var(--warn)}
 .controls{margin:14px 0 0}
 button{background:var(--panel);color:var(--ink);border:1px solid var(--line);
        border-radius:99px;padding:7px 15px;font:inherit;cursor:pointer}
 button:hover{border-color:var(--ok)}
 .rv{margin-top:9px;display:flex;flex-direction:column;gap:8px}
 .vbtns{display:flex;gap:6px}
 .mv{flex:1 1 100%;display:flex;flex-direction:column;gap:6px;margin-top:4px;padding-top:8px;border-top:1px dashed var(--line)}
 .mv label{font-size:11px;color:var(--dim);display:flex;align-items:center;justify-content:space-between;gap:8px}
 .mv select{flex:1;min-width:0;background:#0c100f;color:var(--ink);border:1px solid var(--line);border-radius:6px;
            padding:4px 6px;font:12px inherit}
 .mv select:focus{outline:none;border-color:var(--ok)}
 .v{flex:1;padding:6px 0;font-size:12px;border-radius:8px;opacity:.6;text-align:center}
 .v.on{opacity:1;font-weight:700}
 .v.ok.on{border-color:var(--ok);color:var(--ok)}
 .v.redo.on{border-color:var(--warn);color:var(--warn)}
 .note{flex:1 1 100%;background:#0c100f;color:var(--ink);border:1px solid var(--line);
       border-radius:8px;padding:6px 8px;font:12px/1.4 inherit;resize:vertical}
 .note:focus{outline:none;border-color:var(--ok)}
 .note.has{border-color:var(--ok)}
 figure.v-redo{border-color:var(--warn)}
 figure.v-ok{border-color:var(--ok)}
 .exportbar{position:sticky;top:0;z-index:9;background:var(--bg);padding:10px 0 14px;
            margin-bottom:6px;display:flex;gap:10px;align-items:center;flex-wrap:wrap;
            border-bottom:1px solid var(--line)}
 .count{color:var(--dim);font-size:13px}
 #save{border-color:var(--ok);color:var(--ok);font-weight:700}
 .filters{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:0 0 14px}
 .search{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:99px;
         padding:7px 14px;font:inherit;min-width:200px}
 .search:focus{outline:none;border-color:var(--ok)}
 .chip{background:var(--panel);color:var(--dim);border:1px solid var(--line);border-radius:99px;
       padding:6px 14px;font:12px inherit;cursor:pointer}
 .chip.on{color:var(--ink);border-color:var(--ok);background:#16231f}
 .chip .n{color:var(--dim);margin-left:5px}
 .hidden{display:none !important}
 h2 .visible-n{color:var(--dim);font-weight:400;text-transform:none;letter-spacing:0}
</style>
<h1>Kinetic — what exists so far</h1>
<p class="lede"><b>${items.length}</b> of ${totalBriefs} strips ingested · ${strength.length} strength · ${yoga.length} yoga · frames animate at Health's own ${REP_MS}ms rep</p>
<div class="bar"><i style="width:${(items.length / totalBriefs * 100).toFixed(1)}%"></i></div>
<div class="exportbar">
  <button id="t">pause</button>
  <button id="save">save review →</button>
  <span class="count" id="cnt"></span>
  <span class="count">notes autosave in this browser · “save review” writes straight to frames/review.db when served via npm run serve</span>
</div>

<div class="filters">
  <input class="search" id="q" type="search" placeholder="search by name or slug…">
  <button class="chip on" data-f="all">All</button>
  <button class="chip" data-f="unreviewed">Unreviewed</button>
  <button class="chip" data-f="ok">Kept</button>
  <button class="chip" data-f="redo">Redo</button>
  <button class="chip" data-f="stale">Stale</button>
  <button class="chip" data-f="front">Front view</button>
  <button class="chip" data-f="side">Side view</button>
</div>

<h2>strength <span class="visible-n" id="cnt-strength">(${strength.length})</span></h2>
<div class="grid" id="grid-strength">${(() => { const seen = new Set(); return strength.map((it, i) => {
  const first = !seen.has(it.slug); seen.add(it.slug);
  return card(it, i, first);
}).join(''); })()}</div>

<h2>yoga <span class="visible-n" id="cnt-yoga">(${yoga.length})</span></h2>
<div class="grid" id="grid-yoga">${(() => { const seen = new Set(); return yoga.map((it, i) => {
  const first = !seen.has(it.slug); seen.add(it.slug);
  return card(it, strength.length + i, first);
}).join(''); })()}</div>

<script>
// Ping-pong 1→2→3→2, one rep per REP_MS regardless of frame count, so every
// figure on the page finishes its rep together. Health's ExerciseFigure does
// exactly this; matching it means the gallery previews what the app will show.
const REP = ${REP_MS};
const stages = [...document.querySelectorAll('.stage')].map((el) => {
  const imgs = [...el.querySelectorAll('img')];
  const order = imgs.length > 2
    ? [...imgs.keys(), ...[...imgs.keys()].slice(1, -1).reverse()]
    : [...imgs.keys()];
  return { imgs, order, step: REP / (imgs.length > 2 ? (imgs.length - 1) * 2 : imgs.length) };
});
let playing = true, t0 = performance.now();
function tick(now) {
  if (playing) {
    for (const s of stages) {
      if (s.imgs.length < 2) continue;
      const k = s.order[Math.floor(((now - t0) / s.step)) % s.order.length];
      s.imgs.forEach((im, i) => im.classList.toggle('on', i === k));
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
document.getElementById('t').onclick = (e) => {
  playing = !playing; e.target.textContent = playing ? 'pause' : 'play';
};

// ── review capture ─────────────────────────────────────────────────────────
// Two kinds of state, both round-tripped through frames/review.db:
//   review[key]      — per-card verdict/note, key = "<slug>--<sex>"
//   overrides[slug]  — per-MOVEMENT view/frame choice (both bodies share one)
// localStorage is the safety net between "typed it" and "ran npm run review"
// — the page rebuilds constantly and a note must survive that. Whatever the
// server already knows (from the last DB import) seeds the initial state, so
// reopening a freshly-built gallery shows prior decisions instead of asking
// the reviewer to redo them.
const KEY = 'kinetic.review.v1';
const OKEY = 'kinetic.overrides.v1';
const load = (k) => { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch { return {}; } };
const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

let review = load(KEY);
let overrides = load(OKEY);
// server state wins for anything localStorage has no OPINION on yet (first
// load on a new browser, or after clearing storage) — never overwrites a
// pending unsaved edit sitting in localStorage.
for (const fig of document.querySelectorAll('figure.c')) {
  const key = fig.dataset.key, slug = fig.dataset.slug;
  if (fig.dataset.verdict || fig.dataset.note) {
    review[key] = review[key] || { verdict: fig.dataset.verdict || undefined, note: fig.dataset.note || '' };
  }
}
save(KEY, review);

function paint(fig, rec) {
  fig.classList.toggle('v-ok', rec?.verdict === 'ok');
  fig.classList.toggle('v-redo', rec?.verdict === 'redo');
  fig.querySelectorAll('.v').forEach((b) => b.classList.toggle('on', b.dataset.v === rec?.verdict));
  const ta = fig.querySelector('.note');
  ta.classList.toggle('has', !!(rec?.note || '').trim());
}
function count() {
  const n = Object.values(review).filter((r) => r.verdict || (r.note || '').trim()).length;
  const o = Object.keys(overrides).length;
  document.getElementById('cnt').textContent =
    (n ? n + ' reviewed' : 'no notes yet') + (o ? ' · ' + o + ' view/frame change(s)' : '');
}

for (const fig of document.querySelectorAll('figure.c')) {
  const key = fig.dataset.key, slug = fig.dataset.slug;
  const rec = review[key];
  if (rec?.note) fig.querySelector('.note').value = rec.note;
  paint(fig, rec);
  fig.querySelectorAll('.v').forEach((btn) => {
    btn.onclick = () => {
      const cur = review[key] || {};
      cur.verdict = cur.verdict === btn.dataset.v ? undefined : btn.dataset.v;
      review[key] = cur; save(KEY, review); paint(fig, cur); count();
      if (typeof applyFilters === 'function') applyFilters();
    };
  });
  fig.querySelector('.note').addEventListener('input', (e) => {
    const cur = review[key] || {};
    cur.note = e.target.value;
    review[key] = cur; save(KEY, review); count();
  });

  // movement-level controls exist on one card per slug only
  const vSel = fig.querySelector('.ov-view'), fSel = fig.querySelector('.ov-frames');
  if (vSel && fSel) {
    const record = () => {
      overrides[slug] = { view: vSel.value, frames: Number(fSel.value) };
      save(OKEY, overrides); count();
    };
    vSel.addEventListener('change', record);
    fSel.addEventListener('change', record);
  }
}
count();

// ── filters ─────────────────────────────────────────────────────────────
// Pure client-side: 700 cards is nothing for the DOM, and it means the
// filter bar works the moment the page opens, before any review is done.
let activeFilter = 'all';
const figs = [...document.querySelectorAll('figure.c')];

function currentVerdict(fig) {
  // live verdict, not the server-baked one — reflects clicks made this session
  const key = fig.dataset.key;
  return review[key]?.verdict ?? (fig.dataset.verdict || null);
}

function applyFilters() {
  const q = document.getElementById('q').value.trim().toLowerCase();
  let visible = 0;
  for (const fig of figs) {
    const name = fig.querySelector('.nm').textContent.toLowerCase();
    const slug = fig.dataset.slug.toLowerCase();
    const matchesQ = !q || name.includes(q) || slug.includes(q);

    const v = currentVerdict(fig);
    let matchesFilter = true;
    if (activeFilter === 'unreviewed') matchesFilter = !v;
    else if (activeFilter === 'ok') matchesFilter = v === 'ok';
    else if (activeFilter === 'redo') matchesFilter = v === 'redo';
    else if (activeFilter === 'stale') matchesFilter = fig.dataset.stale === '1';
    else if (activeFilter === 'front') matchesFilter = fig.dataset.view === 'front';
    else if (activeFilter === 'side') matchesFilter = fig.dataset.view === 'side';

    const show = matchesQ && matchesFilter;
    fig.classList.toggle('hidden', !show);
    if (show) visible++;
  }
  for (const grid of ['strength', 'yoga']) {
    const total = document.querySelectorAll('#grid-' + grid + ' figure.c').length;
    const shown = document.querySelectorAll('#grid-' + grid + ' figure.c:not(.hidden)').length;
    document.getElementById('cnt-' + grid).textContent =
      shown === total ? '(' + total + ')' : '(' + shown + ' of ' + total + ')';
  }
}

document.getElementById('q').addEventListener('input', applyFilters);
document.querySelectorAll('.chip').forEach((chip) => {
  chip.onclick = () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
    chip.classList.add('on');
    activeFilter = chip.dataset.f;
    applyFilters();
  };
});
applyFilters();

// Direct-to-SQLite when served by npm run serve (same-origin POST reaches
// db.mjs straight away); falls back to a file download when there is no
// server to answer — opened as a plain file, or sent as a one-off snapshot.
// The two paths write through the SAME function (applyReviewPayload), so
// neither can disagree with the other about what "saving a review" means.
document.getElementById('save').onclick = async () => {
  const out = {};
  for (const [k, v] of Object.entries(review)) {
    if (v.verdict || (v.note || '').trim()) out[k] = v;
  }
  const payload = { savedAt: new Date().toISOString(), items: out, overrides };
  const btn = document.getElementById('save');
  const original = btn.textContent;

  try {
    const res = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('server responded ' + res.status);
    const data = await res.json();
    btn.textContent = 'saved to db ✓ (' + data.reviewCount + ')';
    setTimeout(() => { btn.textContent = original; }, 2500);
    return;
  } catch {
    // no server (opened as a plain file) — fall back to a download
  }

  const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'kinetic-review.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  btn.textContent = 'downloaded (no server running)';
  setTimeout(() => { btn.textContent = original; }, 2500);
};
</script>
`;

// Written to BOTH dist/ (build output) and reviews/ (committed): dist is
// disposable and gitignored, and a review page that vanishes on the next
// clean is not somewhere to leave comments.
mkdirSync(join(ROOT, 'dist'), { recursive: true });
mkdirSync(join(ROOT, 'reviews'), { recursive: true });
writeFileSync(join(ROOT, 'dist', 'gallery.html'), html);
writeFileSync(join(ROOT, 'reviews', 'gallery.html'), html);
console.log(`gallery: ${items.length} movements (${strength.length} strength, ${yoga.length} yoga) → dist/gallery.html + reviews/gallery.html`);
