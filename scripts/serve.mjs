#!/usr/bin/env node
// A local server so reviewing writes DIRECTLY into frames/review.db — no
// download, no `npm run import-review` step. This is the fix for the
// download/import round-trip: opened over http://localhost, the gallery's
// "save review" button POSTs straight to this process instead of triggering
// a file download.
//
//   npm run serve              → http://localhost:5391
//
// GET  /            regenerates and serves the gallery fresh from the CURRENT
//                    corpus + DB state — always up to date, no re-send needed.
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
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDb, applyReviewPayload } from './db.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PORT) || 5391;

function regenerateGallery() {
  execFileSync('node', ['scripts/gallery.mjs'], { cwd: ROOT, stdio: 'pipe' });
  return readFileSync(join(ROOT, 'dist', 'gallery.html'), 'utf8');
}

const server = createServer((req, res) => {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/gallery.html')) {
    try {
      const html = regenerateGallery();
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`gallery regeneration failed:\n${err.message}`);
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

        // Regenerate immediately — the whole point is that a save is FELT
        // downstream right away: the next brief already carries the note.
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
  console.log(`\n  kinetic gallery — http://localhost:${PORT}\n`);
  console.log(`  Reviews save directly into frames/review.db — no download, no import step.`);
  console.log(`  Reload the page any time to see Codex's latest output.\n`);
});
