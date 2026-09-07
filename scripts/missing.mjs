#!/usr/bin/env node
// The parts queue: which of the spec'd body parts have no vector in the
// manifest yet, each with the exact prompt to generate it. Prompts come from
// parts/spec.mjs — one source, so this and the docs cannot disagree.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTS, SEXES, fileFor, promptFor } from '../parts/spec.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = join(ROOT, 'parts', 'manifest.json');
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, 'utf8')) : {};

const promptsOnly = process.argv.includes('--prompts');
let have = 0, missing = 0;

if (!promptsOnly) console.log('\n── posebook · parts still to generate ──\n');
for (const sex of SEXES) {
  for (const part of PARTS) {
    if (part.legacy) continue;
    const key = `${part.slug}--${sex.key}`;
    if (manifest[key]) { have++; continue; }
    missing++;
    if (promptsOnly) {
      console.log(promptFor(part, sex));
    } else {
      console.log(`  parts/inbox/${fileFor(part.slug, sex.key)}   (${part.w}x${part.h})`);
      console.log(`  ${promptFor(part, sex)}\n`);
    }
  }
}
if (!promptsOnly) {
  console.log(missing === 0
    ? `  Nothing to generate — all ${have} parts are in the manifest.\n`
    : `  ${have} in the manifest · MISSING ${missing}. Save into parts/inbox/ under the exact filename, then npm run ingest.\n`);
}
