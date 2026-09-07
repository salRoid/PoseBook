import { copyFileSync, cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const stamp = () => new Date().toISOString().replace(/[:.]/g, '-');

/** Preserve the current strip and split corpus frames before regeneration. */
export function backupFrameSet(root, records, label = 'regeneration') {
  const unique = [...new Map(records.map((r) => [`${r.slug}--${r.sex}`, r])).values()];
  const dir = join(root, 'frames', 'backups', `${stamp()}--${label}`);
  const stripsDir = join(dir, 'strips');
  const corpusDir = join(dir, 'corpus');
  mkdirSync(stripsDir, { recursive: true });
  mkdirSync(corpusDir, { recursive: true });

  const saved = [];
  for (const r of unique) {
    const file = `${r.slug}--${r.sex}.png`;
    const stripCandidates = [
      join(root, 'frames', 'inbox', 'done', file),
      join(root, 'frames', 'inbox', file),
    ];
    const strip = stripCandidates.find(existsSync);
    const corpus = join(root, 'frames', 'corpus', r.slug, r.sex);
    const entry = { slug: r.slug, sex: r.sex, note: r.note ?? '', strip: false, corpus: false };
    if (strip) {
      copyFileSync(strip, join(stripsDir, file));
      entry.strip = true;
    }
    if (existsSync(corpus)) {
      const dst = join(corpusDir, r.slug, r.sex);
      mkdirSync(join(corpusDir, r.slug), { recursive: true });
      cpSync(corpus, dst, { recursive: true });
      entry.corpus = true;
    }
    saved.push(entry);
  }

  writeFileSync(join(dir, 'manifest.json'), JSON.stringify({ createdAt: new Date().toISOString(), label, items: saved }, null, 2) + '\n');
  return { dir, saved };
}
