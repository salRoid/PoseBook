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

const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = join(ROOT, 'frames', 'corpus');
const PREVIEW = 260;
const REP_MS = 2080;

const PLAN = JSON.parse(readFileSync(join(ROOT, 'poses', 'PLAN.json'), 'utf8'));
const BYSLUG = new Map(PLAN.map((r) => [r.slug, r]));

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
      items.push({
        slug, sex, frames,
        name: plan.name ?? slug,
        discipline: plan.discipline ?? 'strength',
        want: plan.frames ?? frames.length,
        stale: (plan.frames ?? frames.length) !== frames.length,
      });
    }
  }
}

const strength = items.filter((i) => i.discipline === 'strength');
const yoga = items.filter((i) => i.discipline === 'yoga');
const totalBriefs = PLAN.length * 2;

const card = (it, i) => `
  <figure class="c${it.stale ? ' stale' : ''}" data-i="${i}">
    <div class="stage">${it.frames.map((d, k) => `<img src="${d}" alt="" class="${k === 0 ? 'on' : ''}">`).join('')}</div>
    <figcaption>
      <span class="nm">${it.name}</span>
      <span class="sx">${it.sex === 'm' ? '♂' : '♀'}</span>
    </figcaption>
    <div class="sub">${it.frames.length} frame${it.frames.length > 1 ? 's' : ''}${it.stale ? ` · STALE, plan wants ${it.want}` : ''}</div>
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
 .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
 .c{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:10px}
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
</style>
<h1>Kinetic — what exists so far</h1>
<p class="lede"><b>${items.length}</b> of ${totalBriefs} strips ingested · ${strength.length} strength · ${yoga.length} yoga · frames animate at Health's own ${REP_MS}ms rep</p>
<div class="bar"><i style="width:${(items.length / totalBriefs * 100).toFixed(1)}%"></i></div>
<div class="controls"><button id="t">pause</button></div>

<h2>strength (${strength.length})</h2>
<div class="grid">${strength.map((it, i) => card(it, i)).join('')}</div>

<h2>yoga (${yoga.length})</h2>
<div class="grid">${yoga.map((it, i) => card(it, strength.length + i)).join('')}</div>

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
</script>
`;

mkdirSync(join(ROOT, 'dist'), { recursive: true });
writeFileSync(join(ROOT, 'dist', 'gallery.html'), html);
console.log(`gallery: ${items.length} movements (${strength.length} strength, ${yoga.length} yoga) → dist/gallery.html`);
