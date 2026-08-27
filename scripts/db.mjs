#!/usr/bin/env node
// The review database — frames/review.db, committed like frames/review.json
// was. SQLite (node:sqlite, no dependency) because the review loop now needs
// QUERIES a flat JSON can't give cheaply: "every redo with a note", "does
// this slug have a view override", "what changed since the last brief run".
//
// Two kinds of row, kept deliberately separate:
//   reviews             — an APPEND-ONLY log, one row per gallery submission.
//                          Never overwritten: a note is evidence for why a
//                          strip was rejected, and losing it loses the reason.
//   movement_overrides  — the CURRENT decision per slug (view / frame count),
//                          one row per movement, upserted. This is what
//                          `npm run brief` reads to override the plan's
//                          heuristic — the mechanism that makes a reviewer's
//                          "this should be front view" actually change what
//                          Codex is asked for next time.
//
// A movement's current verdict/note is DERIVED (latest review row per
// slug+sex), never stored twice — so the log stays the single source of
// truth and nothing can drift from it.

import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DB_PATH = join(ROOT, 'frames', 'review.db');

export function openDb() {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL,
      sex TEXT NOT NULL CHECK (sex IN ('m','f')),
      verdict TEXT CHECK (verdict IN ('ok','redo')),
      note TEXT,
      source TEXT,
      submitted_at TEXT,
      imported_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_reviews_slug_sex ON reviews(slug, sex);

    CREATE TABLE IF NOT EXISTS movement_overrides (
      slug TEXT PRIMARY KEY,
      view TEXT CHECK (view IN ('side','front','back','34')),
      frames INTEGER CHECK (frames BETWEEN 1 AND 4),
      reason TEXT,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

/** Latest verdict/note per slug+sex — the derived "current state" reviews.mjs and gallery.mjs both need. */
export function currentReviews(db) {
  const rows = db.prepare(`
    SELECT r.slug, r.sex, r.verdict, r.note, r.submitted_at
    FROM reviews r
    JOIN (SELECT slug, sex, MAX(id) AS max_id FROM reviews GROUP BY slug, sex) latest
      ON r.slug = latest.slug AND r.sex = latest.sex AND r.id = latest.max_id
  `).all();
  const map = new Map();
  for (const r of rows) map.set(`${r.slug}--${r.sex}`, r);
  return map;
}

export function currentOverrides(db) {
  const rows = db.prepare(`SELECT * FROM movement_overrides`).all();
  const map = new Map();
  for (const r of rows) map.set(r.slug, r);
  return map;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const db = openDb();
  const reviews = currentReviews(db);
  const overrides = currentOverrides(db);
  console.log(`frames/review.db\n  ${reviews.size} reviewed item(s), ${overrides.size} movement override(s)`);
  const redo = [...reviews.values()].filter((r) => r.verdict === 'redo');
  if (redo.length) console.log(`  ${redo.length} marked redo`);
  db.close();
}
