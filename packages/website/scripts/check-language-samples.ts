import * as fs from 'fs';
import * as path from 'path';
import { lookupDict } from '@ingglish/ipa';
import type { PhoneDict } from '@ingglish/ipa';
import { ALL_SAMPLES } from '../src/data/language-samples';

const dictDir = path.resolve(import.meta.dirname, '../public/ipa-dicts');

let totalMissing = 0;
let totalWords = 0;

for (const [lang, samples] of Object.entries(ALL_SAMPLES)) {
  const dictPath = path.join(dictDir, lang + '.json');
  if (!fs.existsSync(dictPath)) {
    console.log(`MISSING DICT: ${lang}`);
    continue;
  }
  const entries = JSON.parse(fs.readFileSync(dictPath, 'utf-8')) as Record<string, string[]>;
  const dict: PhoneDict = { entries, lang };

  for (const sample of samples) {
    const words = sample.text
      .split(/\s+/)
      .map((w) => w.replace(/^\P{L}+/u, '').replace(/\P{L}+$/u, ''))
      .filter(Boolean);
    totalWords += words.length;

    const missing = words.filter((w) => {
      // Direct lookup (includes IPA_WORD_OVERRIDES via lookupDict)
      if (lookupDict(dict, w)) return false;
      // Try splitting contractions/hyphens (like translateDict does)
      const parts = w.split(/(?<=['-])|(?=['-])/);
      if (parts.length > 1) {
        const realParts = parts.filter((p) => p !== "'" && p !== '-');
        if (realParts.some((p) => lookupDict(dict, p))) return false;
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
