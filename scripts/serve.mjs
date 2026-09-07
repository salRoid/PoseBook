#!/usr/bin/env node
// A local server so reviewing writes DIRECTLY into frames/review.db — no
// download, no `npm run import-review` step. This is the fix for the
// download/import round-trip: opened over http://localhost, the gallery's
// "save review" button POSTs straight to this process instead of triggering
// a file download.
//
//   npm run serve              → http://localhost:5391
//
// GET  /            serves the gallery for the CURRENT corpus + DB state,
//                    rebuilding it only when one of those changed (the build
//                    is ~30s, which as a per-request cost looks to a browser
//                    like a page that never loads). `/?fresh` forces a build.
// POST /api/review  the payload the gallery already builds ({items, overrides})
//                    → applyReviewPayload (frames/review.db) → briefs and
//                    status regenerated in the same request, so by the time
//                    the browser gets a response, Codex's next prompt already
//                    carries the correction.
//
// Still works standalone (opened as a plain file, or sent via SendUserFile):
// the gallery's save button falls back to the file-download flow when the
// POST fails, e.g. because there is no server to answer it.

import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, applyReviewPayload } from './db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5391;

const GALLERY = join(ROOT, 'dist', 'gallery.html');
const FRAME_ROUTE = /^\/frames\/([a-z0-9-]+)\/(m|f)\/(frame-[1-9][0-9]*\.svg)$/;

// Regenerating takes ~30s (every frame in the corpus is decoded and inlined),
// which as a per-request cost reads to the browser as a page that never
// opens. So it is only paid when something it depends on has actually
// CHANGED: the newest mtime under frames/corpus, or the review db. Otherwise
// the built file is served as it stands, which is the same bytes.
function newestInputMtime() {
  let newest = 0;
  const bump = (p) => { try { newest = Math.max(newest, statSync(p).mtimeMs); } catch {} };
  bump(join(ROOT, 'frames', 'review.db'));
  const corpus = join(ROOT, 'frames', 'corpus');
  if (existsSync(corpus)) {
    for (const slug of readdirSync(corpus)) {
      const d = join(corpus, slug);
      let st; try { st = statSync(d); } catch { continue; }
      if (!st.isDirectory()) continue;
      for (const sex of readdirSync(d)) bump(join(d, sex, 'meta.json'));
    }
  }
  return newest;
}

function regenerateGallery(force = false) {
  const built = existsSync(GALLERY) ? statSync(GALLERY).mtimeMs : 0;
  if (force || built === 0 || built < newestInputMtime()) {
    console.log('  regenerating the gallery (corpus or reviews changed) — ~30s…');
    execFileSync('node', ['scripts/gallery.mjs'], { cwd: ROOT, stdio: 'pipe' });
  }
  return readFileSync(GALLERY, 'utf8');
}

const server = createServer((req, res) => {
  // The gallery is also opened as a plain FILE (dist/gallery.html, or a copy
  // sent to a phone). Such a page has a different origin, so without CORS its
  // save POST never arrives and the button silently falls back to downloading
  // a json nobody imports. Local-only server, so `*` costs nothing.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && /^\/(gallery\.html)?(\?|$)/.test(req.url)) {
    try {
      const html = regenerateGallery(/^\/(gallery\.html)?\?.*\bfresh\b/.test(req.url));
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`gallery regeneration failed:\n${err.message}`);
    }
    return;
  }

  // Full-screen review uses the original corpus SVG rather than the compact
  // 260px gallery thumbnail. The strict route grammar also makes traversal
  // impossible: only a known slug/sex/frame-shaped path can reach disk.
  const frameMatch = req.method === 'GET' && req.url.match(FRAME_ROUTE);
  if (frameMatch) {
    const [, slug, sex, file] = frameMatch;
    const path = join(ROOT, 'frames', 'corpus', slug, sex, file);
    if (existsSync(path)) {
      res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(readFileSync(path));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('frame not found');
    }
    return;
  }

  if (req.method === 'POST' && req.url === '/api/review') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const db = openDb();
        const { reviewRows, overrideRows } = applyReviewPayload(db, { ...payload, source: 'gallery-live' });
        db.close();

        // Briefs are the generation queue, so update those before confirming
        // the save. Do NOT synchronously rebuild the 700-card gallery here:
        // that takes ~30 seconds, makes the button appear dead, and led to
        // repeated clicks inserting duplicate review rows. The next GET will
        // rebuild the gallery because review.db is now newer than the file.
        execFileSync('node', ['scripts/brief.mjs'], { cwd: ROOT, stdio: 'pipe' });

        console.log(`review saved: ${reviewRows.length} row(s), ${overrideRows.length} override(s)`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, reviewCount: reviewRows.length, overrideCount: overrideRows.length }));
      } catch (err) {
        console.error('review save failed:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  posebook gallery — http://localhost:${PORT}\n`);
  console.log(`  Reviews save directly into frames/review.db — no download, no import step.`);
  console.log(`  Reload the page any time to see Codex's latest output.\n`);
});
