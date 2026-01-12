/**
 * Find the mapping that maximizes identical words WITHOUT creating collisions.
 * A collision is when two different words get the same spelling.
 *
 * Run with: npx vite-node scripts/find-best-no-collisions.ts
 */

import { loadDictionary, getDictionary } from '../src/dictionary/loader';
import { ARPABET_TO_INGGLISH_MAP } from '../src/convert/ingglish-maps';

await loadDictionary();
const cmudict = getDictionary();
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0);

function phonemesToSpelling(phonemes: string[], map: Record<string, string>): string {
  return phonemes.map((p) => map[p.replace(/[0-2]$/, '')] || p.toLowerCase()).join('');
}

function analyzeMapping(map: Record<string, string>): {
  identical: string[];
  collisions: { spelling: string; words: string[] }[];
  collisionCount: number;
} {
  const identical: string[] = [];
  const spellingToWords = new Map<string, string[]>();

  for (const word of allWords) {
    const phonemes = cmudict[word];
    if (!phonemes) continue;
    const spelling = phonemesToSpelling(phonemes, map);

    if (spelling.toLowerCase() === word.toLowerCase()) {
      identical.push(word);
    }

    // Track all spellings
    if (!spellingToWords.has(spelling)) {
      spellingToWords.set(spelling, []);
    }
    spellingToWords.get(spelling)!.push(word);
  }

  // Find collisions (different words with same spelling)
  const collisions: { spelling: string; words: string[] }[] = [];
  let collisionCount = 0;
  for (const [spelling, words] of spellingToWords) {
    // Filter out variant pronunciations of same word (word, word(2), etc)
    const uniqueBaseWords = new Set(words.map((w) => w.replace(/\(\d+\)$/, '')));
    if (uniqueBaseWords.size > 1) {
      collisions.push({ spelling, words });
      collisionCount += words.length - 1; // Count extra words as collisions
    }
  }

  return { identical, collisions, collisionCount };
}

// Get baseline collision count with current mapping
const current = analyzeMapping(ARPABET_TO_INGGLISH_MAP);
console.log(
  `Current mapping: ${current.identical.length} identical, ${current.collisionCount} collisions`
);
console.log(`\nExisting collisions (homophones in English):`);
current.collisions.slice(0, 10).forEach((c) => {
  const bases = [...new Set(c.words.map((w) => w.replace(/\(\d+\)$/, '')))];
  if (bases.length > 1) console.log(`  "${c.spelling}" ← ${bases.join(', ')}`);
});

// Options to try for each phoneme
const allOptions: Record<string, string[]> = {
  AA: ['a', 'o', 'ah', 'aa'],
  AE: ['a', 'e', 'ae'],
  AH: ['a', 'u', 'o', 'uh'],
  AO: ['o', 'aw', 'au', 'ao'],
  AW: ['ow', 'ou', 'au', 'aw'],
  AY: ['i', 'y', 'ai', 'ay', 'iy'],
  EH: ['e', 'a', 'eh'],
  ER: ['er', 'ur', 'ir'],
  EY: ['a', 'ay', 'ai', 'ey', 'ae'],
  IH: ['i', 'e', 'ih'],
  IY: ['e', 'i', 'y', 'ee', 'ie', 'iy'],
  OW: ['o', 'oh', 'ow', 'oe'],
  OY: ['oy', 'oi'],
  UH: ['u', 'oo', 'uh'],
  UW: ['u', 'oo', 'uw', 'uu'],
  K: ['k', 'c'],
  Z: ['z', 's'],
  JH: ['j', 'g', 'dg'],
  DH: ['dh', 'th'],
  F: ['f', 'ph'],
  S: ['s', 'c'],
};

console.log(`\n${'='.repeat(70)}`);
console.log(`FINDING BEST MAPPING WITHOUT NEW COLLISIONS`);
console.log(`${'='.repeat(70)}\n`);

// Greedy optimization: try each change, only keep if it doesn't add collisions
let bestMap = { ...ARPABET_TO_INGGLISH_MAP };
let bestResult = current;
const baselineCollisions = current.collisionCount;

const changes: { phoneme: string; from: string; to: string; gain: number }[] = [];

for (const [phoneme, options] of Object.entries(allOptions)) {
  for (const option of options) {
    if (option === bestMap[phoneme]) continue;

    const testMap = { ...bestMap, [phoneme]: option };
    const result = analyzeMapping(testMap);

    // Only accept if no NEW collisions and more identical words
    if (
      result.collisionCount <= baselineCollisions &&
      result.identical.length > bestResult.identical.length
    ) {
      const gain = result.identical.length - bestResult.identical.length;
      console.log(
        `✓ ${phoneme}: ${bestMap[phoneme]} → ${option} (+${gain} identical, ${result.collisionCount} collisions)`
      );
      changes.push({ phoneme, from: bestMap[phoneme], to: option, gain });
      bestMap[phoneme] = option;
      bestResult = result;
    }
  }
}

console.log(`\n${'='.repeat(70)}`);
console.log(`RESULTS - NO NEW COLLISIONS`);
console.log(`${'='.repeat(70)}`);
console.log(
  `\nCurrent: ${current.identical.length} identical words (${((current.identical.length / allWords.length) * 100).toFixed(2)}%)`
);
console.log(
  `Optimized: ${bestResult.identical.length} identical words (${((bestResult.identical.length / allWords.length) * 100).toFixed(2)}%)`
);
console.log(`Improvement: +${bestResult.identical.length - current.identical.length} words`);
console.log(`Collisions: ${bestResult.collisionCount} (unchanged from baseline)`);

if (changes.length > 0) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`RECOMMENDED CHANGES`);
  console.log(`${'='.repeat(70)}\n`);
  changes.sort((a, b) => b.gain - a.gain);
  for (const { phoneme, from, to, gain } of changes) {
    console.log(`  ${phoneme}: ${from} → ${to} (+${gain} identical words)`);
  }
}

// Show sample new identical words
const newIdentical = bestResult.identical.filter((w) => !current.identical.includes(w));
if (newIdentical.length > 0) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`SAMPLE NEW IDENTICAL WORDS`);
  console.log(`${'='.repeat(70)}\n`);
  console.log(newIdentical.slice(0, 100).join(', '));
}

// Show the final mapping differences
console.log(`\n${'='.repeat(70)}`);
console.log(`FINAL MAPPING (changes only)`);
console.log(`${'='.repeat(70)}\n`);
for (const phoneme of Object.keys(ARPABET_TO_INGGLISH_MAP)) {
  if (bestMap[phoneme] !== ARPABET_TO_INGGLISH_MAP[phoneme]) {
    console.log(`  ${phoneme}: "${ARPABET_TO_INGGLISH_MAP[phoneme]}" → "${bestMap[phoneme]}"`);
  }
}

// Verify no problematic collisions
console.log(`\n${'='.repeat(70)}`);
console.log(`COLLISION CHECK`);
console.log(`${'='.repeat(70)}\n`);
const testPairs = [
  ['cup', 'cap'],
  ['cut', 'cat'],
  ['cot', 'cat'],
  ['so', 'saw'],
  ['go', 'got'],
  ['no', 'not'],
  ['low', 'lot'],
  ['know', 'not'],
];
for (const [w1, w2] of testPairs) {
  const s1 = cmudict[w1] ? phonemesToSpelling(cmudict[w1], bestMap) : '?';
  const s2 = cmudict[w2] ? phonemesToSpelling(cmudict[w2], bestMap) : '?';
  const status = s1 === s2 ? '⚠️ COLLISION' : '✓ distinct';
  console.log(`  ${w1}→${s1}, ${w2}→${s2} ${status}`);
}
