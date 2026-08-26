#!/usr/bin/env node
// Synthetic body parts — crude tapered capsules on the spec's own anchors —
// so the ingest → manifest → compositor pipeline can be proven END TO END
// before any real part is generated. Not art: a plumbing test.
//
//   node scripts/dev-fake-parts.mjs        write test PNGs into parts/inbox/
//
// Clean up after judging the assembly: `rm parts/manifest.json` and rebuild
// to return to stroke rendering.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTS, SEXES, fileFor } from '../parts/spec.mjs';

const { default: sharp } = await import('sharp');
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const INBOX = join(ROOT, 'parts', 'inbox');
mkdirSync(INBOX, { recursive: true });

// widths per part: [at anchor A, at anchor B], vaguely anatomical
const W = {
  'head-side': [30, 0], 'head-front': [30, 0],
  'torso-side': [95, 80], 'torso-front': [150, 170],
  'upper-arm': [60, 42], 'forearm-hand': [44, 30],
  thigh: [78, 50], shin: [52, 34],
  'foot-side': [55, 28], 'foot-front': [60, 44],
};

function capsuleSvg(p, sex) {
  const [wa, wb0] = W[p.slug];
  const k = sex === 'f' ? 0.85 : 1;
  const [ax, ay] = p.a, [bx, by] = p.b;
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len; // unit normal
  const over = 62; // overlong rounded ends past the anchors
  const A = [ax - (dx / len) * over, ay - (dy / len) * over];
  const B = [bx + (dx / len) * over, by + (dy / len) * over];
  let inner = '';
  if (p.slug.startsWith('head')) {
    // heads: the circle must FILL the neck-base→crown span, or the scaled
    // head comes out pea-sized — the first fake build proved it
    const r = (ay - by) * 0.42 * (sex === 'f' ? 0.95 : 1);
    const c = [bx, by + r];
    inner = `<circle cx="${c[0]}" cy="${c[1]}" r="${r}" fill="black"/>` +
      `<rect x="${ax - 55 * k}" y="${c[1]}" width="${110 * k}" height="${ay - c[1] + over}" rx="${50 * k}" fill="black"/>` +
      (sex === 'f' ? `<circle cx="${bx}" cy="${by - 8}" r="${r * 0.4}" fill="black"/>` : '');
  } else {
    const h1 = (wa * k) / 2, h2 = (wb0 * k) / 2;
    const pts = [
      [A[0] + nx * h1, A[1] + ny * h1], [B[0] + nx * h2, B[1] + ny * h2],
      [B[0] - nx * h2, B[1] - ny * h2], [A[0] - nx * h1, A[1] - ny * h1],
    ].map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    inner = `<polygon points="${pts}" fill="black" stroke="black" stroke-width="${Math.min(wa, wb0) * k}" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${p.w}" height="${p.h}"><rect width="100%" height="100%" fill="white"/>${inner}</svg>`;
}

for (const sex of SEXES) {
  for (const p of PARTS) {
    const png = await sharp(Buffer.from(capsuleSvg(p, sex.key))).png().toBuffer();
    writeFileSync(join(INBOX, fileFor(p.slug, sex.key)), png);
  }
}
console.log(`dev-fake-parts: ${PARTS.length * SEXES.length} synthetic parts in parts/inbox/ — now: npm run ingest && npm run build`);
