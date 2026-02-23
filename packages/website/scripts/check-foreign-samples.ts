import * as fs from 'fs';
import * as path from 'path';

const dictDir = path.resolve(import.meta.dirname, '../public/ipa-dicts');

// Parse samples from the source file to stay in sync
const samplesSource = fs.readFileSync(
  path.resolve(import.meta.dirname, '../src/data/foreign-samples.ts'),
  'utf-8'
);

// Extract language blocks: "xx: [...]"
const langBlockRegex = /(\w{2}):\s*\[([\s\S]*?)\],/g;
const sampleRegex = /label:\s*'([^']+)',\s*text:\s*(?:'([^']*)'|"([^"]*)")/g;

interface Sample {
  label: string;
  text: string;
}

const allSamples: Record<string, Sample[]> = {};
let langMatch;
while ((langMatch = langBlockRegex.exec(samplesSource)) !== null) {
  const lang = langMatch[1]!;
  const block = langMatch[2]!;
  const samples: Sample[] = [];
  let sampleMatch;
  const re = new RegExp(sampleRegex.source, 'g');
  while ((sampleMatch = re.exec(block)) !== null) {
    samples.push({ label: sampleMatch[1]!, text: sampleMatch[2] ?? sampleMatch[3]! });
  }
  allSamples[lang] = samples;
}

function lookup(dict: Record<string, string>, w: string): string | undefined {
  return dict[w] ?? dict[w.toLowerCase()];
}

let totalMissing = 0;
let totalWords = 0;

for (const [lang, samples] of Object.entries(allSamples)) {
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
