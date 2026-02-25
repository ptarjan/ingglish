import * as fs from 'fs';
import * as path from 'path';
import { FOREIGN_SAMPLES } from '../src/data/foreign-samples';

const dictDir = path.resolve(import.meta.dirname, '../public/ipa-dicts');

function stripAccents(s: string): string {
  return s.normalize('NFD').replaceAll(/[\u0300-\u036F]/g, '');
}

function lookup(dict: Record<string, string>, w: string): string | undefined {
  const lower = w.toLowerCase();
  const title = lower.charAt(0).toUpperCase() + lower.slice(1);
  const stripped = stripAccents(lower);
  return dict[w] ?? dict[lower] ?? dict[title] ?? dict[stripped];
}

let totalMissing = 0;
let totalWords = 0;

for (const [lang, samples] of Object.entries(FOREIGN_SAMPLES)) {
  const dictPath = path.join(dictDir, lang + '.json');
  if (!fs.existsSync(dictPath)) {
    console.log(`MISSING DICT: ${lang}`);
    continue;
  }
  const dict: Record<string, string> = JSON.parse(fs.readFileSync(dictPath, 'utf-8'));

  for (const sample of samples) {
    const words = sample.text
      .split(/\s+/)
      .map((w) => w.replace(/^\P{L}+/u, '').replace(/\P{L}+$/u, ''))
      .filter(Boolean);
    totalWords += words.length;

    const missing = words.filter((w) => {
      // Direct lookup
      if (lookup(dict, w)) return false;
      // Try splitting contractions/hyphens (like translateForeign does)
      const parts = w.split(/(?<=['-])|(?=['-])/);
      if (parts.length > 1) {
        const realParts = parts.filter((p) => p !== "'" && p !== '-');
        if (realParts.some((p) => lookup(dict, p))) return false;
      }
      return true;
    });

    if (missing.length > 0) {
      totalMissing += missing.length;
      console.log(
        `${lang.toUpperCase()} [${sample.label}]: MISSING ${missing.length}/${words.length} — ${missing.join(', ')}`
      );
    } else {
      console.log(`${lang.toUpperCase()} [${sample.label}]: OK (${words.length}/${words.length})`);
    }
  }
}

console.log(`\n${totalWords - totalMissing}/${totalWords} words found`);
if (totalMissing > 0) {
  console.log(`${totalMissing} missing`);
  process.exit(1);
} else {
  console.log('All samples OK!');
}
