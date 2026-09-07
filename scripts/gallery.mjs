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
const DONE = join(ROOT, 'frames', 'inbox', 'done');
const GALLERY_STATE = join(ROOT, 'reviews', 'gallery-state.json');
const PREVIEW = 260;
const REP_MS = 2080;
// Must match serve.mjs — the page needs the ABSOLUTE url to reach the server
// when it is opened as a file rather than served. serve.mjs regenerates the
// gallery in a child process, so a custom PORT reaches here through the env.
const PORT = Number(process.env.PORT) || 5391;

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
      const source = join(DONE, `${slug}--${sex}.png`);
      const addedAt = (existsSync(source) ? statSync(source) : statSync(join(dir, files.at(-1)))).mtime.toISOString();
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
        addedAt,
      });
    }
  }
}

// Keep a tiny catalogue snapshot outside dist/ so each rebuild can identify
// the exact most-recent ingestion batch. A rebuild with no new strips retains
// the previous batch instead of making the useful NEW markers disappear.
let galleryState = { known: {}, latestBatch: [], latestBatchAt: null };
const hadGalleryState = existsSync(GALLERY_STATE);
if (hadGalleryState) {
  try { galleryState = { ...galleryState, ...JSON.parse(readFileSync(GALLERY_STATE, 'utf8')) }; } catch {}
}
const generatedAt = new Date().toISOString();
const newKeys = hadGalleryState
  ? items.map((it) => `${it.slug}--${it.sex}`).filter((key) => !galleryState.known[key])
  : [];
for (const it of items) galleryState.known[`${it.slug}--${it.sex}`] ??= it.addedAt;
if (newKeys.length) {
  galleryState.latestBatch = newKeys;
  galleryState.latestBatchAt = generatedAt;
}
galleryState.updatedAt = generatedAt;
const latestKeys = new Set(galleryState.latestBatch);
for (const it of items) it.latest = latestKeys.has(`${it.slug}--${it.sex}`);

const newestFirst = (a, b) => new Date(b.addedAt) - new Date(a.addedAt) || a.slug.localeCompare(b.slug);
const strength = items.filter((i) => i.discipline === 'strength').sort(newestFirst);
const yoga = items.filter((i) => i.discipline === 'yoga').sort(newestFirst);
const totalBriefs = PLAN.length * 2;

// Every card carries its own review controls. The key is `<slug>--<sex>`,
// which is the same id the briefs, the corpus and `npm run status` use — so a
// note written here addresses exactly one regeneratable unit. View/frames are
// a MOVEMENT property (both bodies share a viewpoint), so those two controls
// are keyed on the slug alone and appear once per movement, on its FIRST
// card in the grid. The secondary card still carries the controls so they are
// available in full-screen review; CSS hides that duplicate until it opens.
const VIEWS = ['side', 'front', 'back', '34'];
const viewLabel = { side: 'Side', front: 'Front', back: 'Back', '34': 'Three-quarter' };
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;');
const card = (it, i, showMovementControls) => `
  <figure class="c${it.stale ? ' stale' : ''}${it.latest ? ' latest' : ''}" data-i="${i}" data-key="${it.slug}--${it.sex}" data-slug="${it.slug}"
          data-verdict="${it.verdict ?? ''}" data-note="${esc(it.note)}" data-view="${it.view}" data-stale="${it.stale ? '1' : '0'}">
    <div class="stage" role="button" tabindex="0" aria-label="Open ${esc(it.name)} full-screen review">${it.frames.map((d, k) => `<i style="--f:url(${d});--full:url('/frames/${encodeURIComponent(it.slug)}/${it.sex}/frame-${k + 1}.svg')" class="${k === 0 ? 'on' : ''}"></i>`).join('')}<span class="expand" aria-hidden="true">expand ↗</span></div>
    <figcaption>
      <span class="nm">${it.name}${it.latest ? ' <b class="new">NEW</b>' : ''}</span>
      <span class="sx">${it.sex === 'm' ? '♂' : '♀'}</span>
    </figcaption>
    <div class="sub" data-plan-view="${it.planView}">${it.frames.length} frame${it.frames.length > 1 ? 's' : ''} · ${viewLabel[it.view] ?? it.view}${it.stale ? ` · STALE, plan wants ${it.want}` : ''}${it.view !== it.planView ? ` · view overridden (plan: ${viewLabel[it.planView]})` : ''}</div>
    <time class="added" datetime="${it.addedAt}" title="${it.addedAt}">Added ${new Date(it.addedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
    <div class="rv">
      <div class="vbtns">
        <button class="v ok"   data-v="ok">keep</button>
        <button class="v redo" data-v="redo">redo</button>
      </div>
      <textarea class="note" rows="2" placeholder="what's wrong / what to change…"></textarea>
      <div class="mv${showMovementControls ? '' : ' movement-secondary'}">
        <label>View <select class="ov-view">${VIEWS.map((v) => `<option value="${v}"${v === it.view ? ' selected' : ''}>${viewLabel[v]}</option>`).join('')}</select></label>
        <label>Frames <select class="ov-frames">${[1, 2, 3, 4].map((n) => `<option value="${n}"${n === it.want ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
      </div>
    </div>
  </figure>`;

const html = `<!doctype html><meta charset="utf-8"><title>PoseBook — what exists so far</title>
<style>
 /* --fig is the FIGURE INK. The corpus SVGs paint currentColor through a
    mask, so the art has no colour of its own — here the preview PNG is used
    the same way, as a CSS mask over a --fig block, which is exactly what
    Health does. Flipping the theme therefore proves the real contract, not a
    gallery trick: one corpus, readable on a white screen and a black one. */
 :root{--bg:#101413;--panel:#171d1c;--line:#232b29;--ink:#e8edeb;--dim:#8a9693;
       --ok:#4FD6AE;--warn:#e0a33a;--stage:#0c100f;--fig:#e8edeb;--input:#0c100f;--chipon:#16231f}
 :root[data-theme="light"]{--bg:#EFF1F0;--panel:#FFFFFF;--line:#DCE1DF;--ink:#161A19;--dim:#5C6663;
       --ok:#127A63;--warn:#B0552F;--stage:#F5F7F6;--fig:#161A19;--input:#FFFFFF;--chipon:#E4EFEA}
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
 .c.latest{box-shadow:0 0 0 1px var(--ok) inset}
 .stage{position:relative;aspect-ratio:1;background:var(--stage);border-radius:10px;overflow:hidden}
 .stage i{position:absolute;inset:0;opacity:0;transition:opacity .12s linear;background:var(--fig);
          -webkit-mask:var(--f) center/contain no-repeat;mask:var(--f) center/contain no-repeat}
 .stage i.on{opacity:1}
 .stage{cursor:zoom-in}
 .stage:focus-visible{outline:2px solid var(--ok);outline-offset:2px}
 .expand{position:absolute;right:9px;top:8px;z-index:2;padding:3px 8px;border-radius:99px;
         color:var(--dim);background:color-mix(in srgb,var(--stage) 82%,transparent);font-size:10px;
         letter-spacing:.03em;text-transform:uppercase;pointer-events:none}
 figcaption{display:flex;justify-content:space-between;gap:8px;margin-top:9px;font-size:13px}
 .nm{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .sx{color:var(--dim)}
 .sub{color:var(--dim);font-size:11px;margin-top:2px}
 .added{color:var(--dim);font-size:11px;margin-top:2px}
 .new{display:inline-block;color:var(--bg);background:var(--ok);border-radius:99px;
      padding:1px 6px;margin-left:5px;font-size:9px;line-height:1.5;vertical-align:1px}
 .c.stale .sub{color:var(--warn)}
 .controls{margin:14px 0 0}
 button{background:var(--panel);color:var(--ink);border:1px solid var(--line);
        border-radius:99px;padding:7px 15px;font:inherit;cursor:pointer}
 button:hover{border-color:var(--ok)}
 .rv{margin-top:9px;display:flex;flex-direction:column;gap:8px}
 .vbtns{display:flex;gap:6px}
 .mv{flex:1 1 100%;display:flex;flex-direction:column;gap:6px;margin-top:4px;padding-top:8px;border-top:1px dashed var(--line)}
 .mv label{font-size:11px;color:var(--dim);display:flex;align-items:center;justify-content:space-between;gap:8px}
 .mv select{flex:1;min-width:0;background:var(--input);color:var(--ink);border:1px solid var(--line);border-radius:6px;
            padding:4px 6px;font:12px inherit}
 .mv select:focus{outline:none;border-color:var(--ok)}
 .v{flex:1;padding:6px 0;font-size:12px;border-radius:8px;opacity:.6;text-align:center}
 .v.on{opacity:1;font-weight:700}
 .v.ok.on{border-color:var(--ok);color:var(--ok)}
 .v.redo.on{border-color:var(--warn);color:var(--warn)}
 .note{flex:1 1 100%;background:var(--input);color:var(--ink);border:1px solid var(--line);
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
 .sort{background:var(--panel);color:var(--ink);border:1px solid var(--line);border-radius:99px;
       padding:7px 12px;font:12px inherit}
 .chip{background:var(--panel);color:var(--dim);border:1px solid var(--line);border-radius:99px;
       padding:6px 14px;font:12px inherit;cursor:pointer}
 .chip.on{color:var(--ink);border-color:var(--ok);background:var(--chipon)}
 .chip .n{color:var(--dim);margin-left:5px}
 .hidden{display:none !important}
 h2 .visible-n{color:var(--dim);font-weight:400;text-transform:none;letter-spacing:0}
 .movement-secondary{display:none}
 body.detail-mode{overflow:hidden}
 body.detail-mode .exportbar{z-index:1}
 .c.detail-active{position:fixed;inset:0;z-index:100;margin:0;border:0;border-radius:0;padding:24px;
                  background:var(--bg);display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,420px);
                  grid-template-rows:auto auto auto 1fr;column-gap:24px;row-gap:8px}
 .c.detail-active .stage{grid-column:1;grid-row:1/-1;width:100%;height:calc(100vh - 48px);
                         aspect-ratio:auto;border:1px solid var(--line);cursor:default}
 .served .c.detail-active .stage i{-webkit-mask-image:var(--full);mask-image:var(--full)}
 .c.detail-active .expand{display:none}
 .c.detail-active figcaption{grid-column:2;grid-row:1;margin:0;padding-right:52px;font-size:22px;font-weight:700}
 .c.detail-active .sub{grid-column:2;grid-row:2;font-size:13px}
 .c.detail-active .added{grid-column:2;grid-row:3;font-size:12px}
 .c.detail-active .rv{grid-column:2;grid-row:4;align-self:start;margin-top:18px;gap:12px}
 .c.detail-active .v{padding:10px 0;font-size:14px}
 .c.detail-active .note{min-height:180px;font-size:14px;padding:10px;resize:vertical}
 .c.detail-active .movement-secondary{display:flex}
 #detail-controls{display:none}
 body.detail-mode #detail-controls{position:fixed;right:24px;bottom:24px;z-index:110;display:flex;
                                   align-items:center;gap:8px;padding:8px;border:1px solid var(--line);
                                   border-radius:12px;background:var(--panel);box-shadow:0 12px 40px #0008}
 #detail-position{min-width:76px;text-align:center;color:var(--dim);font-size:12px}
 #detail-close{font-size:18px;line-height:1;padding:7px 11px}
 .quick-comments{display:none}
 .c.detail-active .quick-comments{display:block;order:-1;padding-bottom:10px;border-bottom:1px dashed var(--line)}
 .quick-label{display:block;margin-bottom:7px;color:var(--dim);font-size:11px;text-transform:uppercase;letter-spacing:.08em}
 .quick-list{display:flex;flex-wrap:wrap;gap:6px}
 .quick-chip{padding:5px 9px;border-radius:7px;color:var(--dim);font-size:11px;text-align:left}
 .quick-chip:hover{color:var(--ink)}
 .quick-chip.recent{border-color:var(--ok);color:var(--ink)}
 @media (max-width:760px){
   .c.detail-active{padding:12px;display:flex;overflow:auto;gap:8px}
   .c.detail-active .stage{height:auto;min-height:48vh;aspect-ratio:1}
   .c.detail-active figcaption{margin-top:8px;padding-right:44px}
   .c.detail-active .rv{margin-top:8px;padding-bottom:70px}
   body.detail-mode #detail-controls{right:12px;bottom:12px}
 }
</style>
<h1>PoseBook — what exists so far</h1>
<p class="lede"><b>${items.length}</b> of ${totalBriefs} strips ingested · ${strength.length} strength · ${yoga.length} yoga · generated ${new Date(generatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} · frames animate at Health's own ${REP_MS}ms rep</p>
<div class="bar"><i style="width:${(items.length / totalBriefs * 100).toFixed(1)}%"></i></div>
<div class="exportbar">
  <button id="t">pause</button>
  <button id="theme">☀︎ light</button>
  <button id="save">save review →</button>
  <span class="count" id="cnt"></span>
  <span class="count">notes autosave in this browser · “save review” writes straight to frames/review.db when served via npm run serve</span>
</div>

<div class="filters">
  <input class="search" id="q" type="search" placeholder="search by name or slug…">
  <select class="sort" id="sort" aria-label="Sort gallery"><option value="newest">Newest first</option><option value="name">Name A–Z</option></select>
  <button class="chip on" data-f="all">All</button>
  <button class="chip" data-f="latest">Latest batch <span class="n">${latestKeys.size || ''}</span></button>
  <button class="chip" data-f="unreviewed">Unreviewed</button>
  <button class="chip" data-f="ok">Kept</button>
  <button class="chip" data-f="redo">Redo</button>
  <button class="chip" data-f="stale">Stale</button>
  <button class="chip" data-f="front">Front view</button>
  <button class="chip" data-f="side">Side view</button>
</div>

<div id="detail-controls" aria-label="Full-screen review navigation">
  <button id="detail-prev" title="Previous exercise (Left arrow)">← previous</button>
  <span id="detail-position"></span>
  <button id="detail-next" title="Next exercise (Right arrow)">next →</button>
  <button id="detail-close" title="Close full-screen review (Escape)" aria-label="Close">×</button>
</div>

<div id="quick-comments" class="quick-comments">
  <span class="quick-label">Quick comments — click to add</span>
  <div id="quick-list" class="quick-list"></div>
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
  const imgs = [...el.querySelectorAll('.stage i')];
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
// THEME. The point of the toggle is not decoration: the corpus paints
// currentColor through a mask, so the same files have to read on a white
// screen and a black one. Flipping this is the check that they do — if a
// figure disappears in light mode, the art is baked white and the ingest
// wrapper is wrong, which is exactly the regression this button catches.
const THEME_KEY = 'posebook-theme';
document.documentElement.classList.toggle('served', location.protocol === 'http:' || location.protocol === 'https:');
const themeBtn = document.getElementById('theme');
function applyTheme(t) {
  document.documentElement.dataset.theme = t === 'light' ? 'light' : 'dark';
  themeBtn.textContent = t === 'light' ? '☾ dark' : '☀︎ light';
  try { localStorage.setItem(THEME_KEY, t); } catch {}
}
themeBtn.onclick = () => applyTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
applyTheme((() => { try { return localStorage.getItem(THEME_KEY) || 'dark'; } catch { return 'dark'; } })());

// localStorage is the safety net between "typed it" and "ran npm run review"
// — the page rebuilds constantly and a note must survive that. Whatever the
// server already knows (from the last DB import) seeds the initial state, so
// reopening a freshly-built gallery shows prior decisions instead of asking
// the reviewer to redo them.
const KEY = 'posebook.review.v1';
const OKEY = 'posebook.overrides.v1';
// Renamed Kinetic -> PoseBook on 2026-09-06. A reviewer mid-session has
// drafts sitting under the OLD keys, and a rename that silently orphans them
// loses real work, so load() falls back to the kinetic.* key once and the
// next save() writes it forward under the new name.
const load = (k) => {
  const read = (kk) => { try { return JSON.parse(localStorage.getItem(kk)) || null; } catch { return null; } };
  return read(k) || read(k.replace(/^posebook/, 'kinetic')) || {};
};
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

  // Movement-level controls are visible once in the grid and on either sex
  // in full-screen review. Keep both copies synchronized because the setting
  // belongs to the movement, not to one figure.
  const vSel = fig.querySelector('.ov-view'), fSel = fig.querySelector('.ov-frames');
  if (vSel && fSel) {
    const record = () => {
      overrides[slug] = { view: vSel.value, frames: Number(fSel.value) };
      for (const peer of document.querySelectorAll('figure[data-slug="' + slug + '"]')) {
        peer.querySelector('.ov-view').value = vSel.value;
        peer.querySelector('.ov-frames').value = fSel.value;
      }
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

// ── full-screen review ──────────────────────────────────────────────────
// The real card becomes the full-screen surface, so verdict, note and
// movement controls remain the exact same inputs rather than a fragile copy.
let detailFig = null;
const detailPosition = document.getElementById('detail-position');
const quickComments = document.getElementById('quick-comments');
const quickList = document.getElementById('quick-list');
const QUICK_KEY = 'posebook.quick-comments.v1';
const QUICK_PRESETS = [
  'Wrong facing direction',
  'Pose does not match the movement',
  'Frame order is wrong',
  'Wrong number of frames',
  'Anatomy needs correction',
  'Equipment or prop is wrong',
  'Figure or limb is cropped',
  'Style or person changed'
];
let recentComments = load(QUICK_KEY);
if (!Array.isArray(recentComments)) recentComments = [];
const visibleFigs = () => [...document.querySelectorAll('figure.c:not(.hidden)')];

function rememberComment(value) {
  const note = value.trim();
  if (!note || QUICK_PRESETS.includes(note)) return;
  recentComments = [note, ...recentComments.filter((v) => v !== note)].slice(0, 6);
  save(QUICK_KEY, recentComments);
}
function renderQuickComments() {
  const comments = [
    ...recentComments.map((text) => ({ text, recent: true })),
    ...QUICK_PRESETS.map((text) => ({ text, recent: false }))
  ];
  quickList.replaceChildren(...comments.map(({ text, recent }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quick-chip' + (recent ? ' recent' : '');
    button.textContent = text;
    button.title = recent ? 'Recently used comment' : 'Quick comment';
    button.onclick = () => {
      if (!detailFig) return;
      const note = detailFig.querySelector('.note');
      const current = note.value.trim();
      if (!current) note.value = text;
      else if (!current.split('\\n').includes(text)) note.value = current + '\\n' + text;
      note.dispatchEvent(new Event('input', { bubbles: true }));
      rememberComment(text);
      renderQuickComments();
      note.focus();
    };
    return button;
  }));
}
function rememberDetailComment() {
  if (detailFig) rememberComment(detailFig.querySelector('.note').value);
}

function updateDetailPosition() {
  const visible = visibleFigs();
  const i = visible.indexOf(detailFig);
  detailPosition.textContent = i < 0 ? '' : (i + 1) + ' / ' + visible.length;
}
function openDetail(fig) {
  if (detailFig === fig) return;
  rememberDetailComment();
  detailFig?.classList.remove('detail-active');
  detailFig = fig;
  detailFig.classList.add('detail-active');
  detailFig.querySelector('.rv').prepend(quickComments);
  document.body.classList.add('detail-mode');
  renderQuickComments();
  updateDetailPosition();
}
function closeDetail() {
  if (!detailFig) return;
  rememberDetailComment();
  detailFig.classList.remove('detail-active');
  detailFig = null;
  document.body.appendChild(quickComments);
  document.body.classList.remove('detail-mode');
}
function moveDetail(delta) {
  const visible = visibleFigs();
  if (!detailFig || !visible.length) return;
  const i = visible.indexOf(detailFig);
  openDetail(visible[(i + delta + visible.length) % visible.length]);
}

for (const fig of figs) {
  const stage = fig.querySelector('.stage');
  stage.addEventListener('click', () => openDetail(fig));
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(fig); }
  });
}
document.getElementById('detail-prev').onclick = () => moveDetail(-1);
document.getElementById('detail-next').onclick = () => moveDetail(1);
document.getElementById('detail-close').onclick = closeDetail;
document.addEventListener('keydown', (e) => {
  if (!detailFig) return;
  if (e.key === 'Escape') { e.preventDefault(); closeDetail(); return; }
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if (e.key === 'ArrowLeft') { e.preventDefault(); moveDetail(-1); }
  if (e.key === 'ArrowRight') { e.preventDefault(); moveDetail(1); }
});

for (const time of document.querySelectorAll('time.added')) {
  const d = new Date(time.dateTime);
  time.textContent = 'Added ' + new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

function applySort() {
  const mode = document.getElementById('sort').value;
  for (const grid of document.querySelectorAll('.grid')) {
    const cards = [...grid.querySelectorAll('figure.c')];
    cards.sort((a, b) => mode === 'newest'
      ? (new Date(b.querySelector('time').dateTime) - new Date(a.querySelector('time').dateTime)) || a.dataset.slug.localeCompare(b.dataset.slug)
      : a.dataset.slug.localeCompare(b.dataset.slug));
    for (const card of cards) grid.appendChild(card);
  }
}

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
    else if (activeFilter === 'latest') matchesFilter = fig.classList.contains('latest');
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
document.getElementById('sort').addEventListener('change', () => { applySort(); applyFilters(); });
document.querySelectorAll('.chip').forEach((chip) => {
  chip.onclick = () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('on'));
    chip.classList.add('on');
    activeFilter = chip.dataset.f;
    applyFilters();
  };
});
applySort();
applyFilters();

// Direct-to-SQLite when 'npm run serve' is running. TWO endpoints are tried,
// because the download kept coming back for a reason that looks like a bug and
// is not: opened as a plain FILE (dist/gallery.html, or a copy sent to another
// device) the page's origin is not the server, so the same-origin POST cannot
// reach it. The absolute localhost URL covers that case — serve.mjs answers
// CORS preflight for exactly this — and the download is what is left when
// there really is no server listening, which is then said out loud.
const SAVE_ENDPOINTS = ['/api/review', 'http://localhost:${PORT}/api/review'];

document.getElementById('save').onclick = async () => {
  const out = {};
  for (const [k, v] of Object.entries(review)) {
    if (v.verdict || (v.note || '').trim()) out[k] = v;
  }
  const payload = { savedAt: new Date().toISOString(), items: out, overrides };
  const btn = document.getElementById('save');
  const original = btn.textContent;
  btn.textContent = 'saving…';
  btn.disabled = true;

  for (const url of SAVE_ENDPOINTS) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('server responded ' + res.status);
      const data = await res.json();
      btn.textContent = 'saved to db ✓ (' + data.reviewCount + ')';
      setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2500);
      return;
    } catch { /* try the next endpoint */ }
  }

  // Nothing answered — no server is running. Download, and SAY so, with the
  // command that would have made this a direct save.
  const blob = new Blob([JSON.stringify(payload, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'posebook-review.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  btn.textContent = 'downloaded — no server; run npm run serve to save to the db';
  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 6000);
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
writeFileSync(GALLERY_STATE, JSON.stringify(galleryState, null, 2) + '\n');
console.log(`gallery: ${items.length} movements (${strength.length} strength, ${yoga.length} yoga) → dist/gallery.html + reviews/gallery.html`);
