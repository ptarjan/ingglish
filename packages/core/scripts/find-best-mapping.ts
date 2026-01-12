/**
 * Find the mapping that maximizes identical words.
 * Show what words become identical and what trade-offs exist.
 *
 * Run with: npx vite-node scripts/find-best-mapping.ts
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
  changed: { word: string; spelling: string }[];
} {
  const identical: string[] = [];
  const changed: { word: string; spelling: string }[] = [];

  for (const word of allWords) {
    const phonemes = cmudict[word];
    if (!phonemes) continue;
    const spelling = phonemesToSpelling(phonemes, map);
    if (spelling.toLowerCase() === word.toLowerCase()) {
      identical.push(word);
    } else {
      changed.push({ word, spelling });
    }
  }
  return { identical, changed };
}

// Current mapping
const current = analyzeMapping(ARPABET_TO_INGGLISH_MAP);
console.log(`Current mapping: ${current.identical.length} identical words`);

// Try all single-letter alternatives for vowels
const vowelPhonemes = [
  'AA',
  'AE',
  'AH',
  'AO',
  'AW',
  'AY',
  'EH',
  'ER',
  'EY',
  'IH',
  'IY',
  'OW',
  'OY',
  'UH',
  'UW',
];
const vowelOptions = ['a', 'e', 'i', 'o', 'u', 'y'];

console.log(`\n${'='.repeat(70)}`);
console.log(`FINDING OPTIMAL SINGLE-LETTER VOWEL MAPPINGS`);
console.log(`${'='.repeat(70)}\n`);

// For each vowel phoneme, find which single letter maximizes identical words
const bestVowelMap: Record<string, string> = { ...ARPABET_TO_INGGLISH_MAP };

for (const phoneme of vowelPhonemes) {
  let bestLetter = ARPABET_TO_INGGLISH_MAP[phoneme];
  let bestCount = current.identical.length;

  for (const letter of vowelOptions) {
    const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: letter };
    const result = analyzeMapping(testMap);
    if (result.identical.length > bestCount) {
      bestCount = result.identical.length;
      bestLetter = letter;
    }
  }

  if (bestLetter !== ARPABET_TO_INGGLISH_MAP[phoneme]) {
    console.log(
      `${phoneme}: ${ARPABET_TO_INGGLISH_MAP[phoneme]} → ${bestLetter} (+${bestCount - current.identical.length} words)`
    );
    bestVowelMap[phoneme] = bestLetter;
  }
}

// Test the optimized vowel map
const optimizedVowels = analyzeMapping(bestVowelMap);
console.log(
  `\nWith optimized vowels: ${optimizedVowels.identical.length} identical words (+${optimizedVowels.identical.length - current.identical.length})`
);

// Now let's do a full optimization - try multiple options for each phoneme
console.log(`\n${'='.repeat(70)}`);
console.log(`GREEDY OPTIMIZATION - FINDING BEST OVERALL MAPPING`);
console.log(`${'='.repeat(70)}\n`);

const allPhonemes = Object.keys(ARPABET_TO_INGGLISH_MAP);
const allOptions: Record<string, string[]> = {
  // Vowels
  AA: ['a', 'o', 'ah'],
  AE: ['a', 'e', 'ai'],
  AH: ['a', 'u', 'o', 'uh'],
  AO: ['o', 'a', 'aw', 'au'],
  AW: ['ow', 'ou', 'au'],
  AY: ['i', 'y', 'ai', 'ay'],
  EH: ['e', 'a', 'ai'],
  ER: ['er', 'ur', 'ir'],
  EY: ['a', 'ay', 'ai', 'ey'],
  IH: ['i', 'e', 'y'],
  IY: ['e', 'i', 'y', 'ee', 'ie'],
  OW: ['o', 'oh', 'ow'],
  OY: ['oy', 'oi'],
  UH: ['u', 'o', 'oo'],
  UW: ['u', 'oo', 'ew'],
  // Consonants
  B: ['b'],
  CH: ['ch'],
  D: ['d'],
  DH: ['th'],
  F: ['f', 'ph'],
  G: ['g'],
  HH: ['h'],
  JH: ['j', 'g'],
  K: ['k', 'c'],
  L: ['l'],
  M: ['m'],
  N: ['n'],
  NG: ['ng'],
  P: ['p'],
  R: ['r'],
  S: ['s', 'c'],
  SH: ['sh'],
  T: ['t'],
  TH: ['th'],
  V: ['v'],
  W: ['w'],
  Y: ['y'],
  Z: ['z', 's'],
  ZH: ['zh', 'z'],
};

// Greedy optimization: for each phoneme, pick the option that gives the most identical words
let bestMap = { ...ARPABET_TO_INGGLISH_MAP };
let bestTotal = current.identical.length;

for (const phoneme of allPhonemes) {
  const options = allOptions[phoneme] || [ARPABET_TO_INGGLISH_MAP[phoneme]];
  let bestOption = bestMap[phoneme];
  let bestForPhoneme = bestTotal;

  for (const option of options) {
    const testMap = { ...bestMap, [phoneme]: option };
    const result = analyzeMapping(testMap);
    if (result.identical.length > bestForPhoneme) {
      bestForPhoneme = result.identical.length;
      bestOption = option;
    }
  }

  if (bestOption !== bestMap[phoneme]) {
    console.log(
      `${phoneme}: ${bestMap[phoneme]} → ${bestOption} (now ${bestForPhoneme} identical)`
    );
    bestMap[phoneme] = bestOption;
    bestTotal = bestForPhoneme;
  }
}

const optimized = analyzeMapping(bestMap);
console.log(`\n${'='.repeat(70)}`);
console.log(`RESULTS`);
console.log(`${'='.repeat(70)}`);
console.log(
  `\nCurrent: ${current.identical.length} identical words (${((current.identical.length / allWords.length) * 100).toFixed(2)}%)`
);
console.log(
  `Optimized: ${optimized.identical.length} identical words (${((optimized.identical.length / allWords.length) * 100).toFixed(2)}%)`
);
console.log(
  `Improvement: +${optimized.identical.length - current.identical.length} words (+${(((optimized.identical.length - current.identical.length) / current.identical.length) * 100).toFixed(1)}%)`
);

// Show the differences
console.log(`\n${'='.repeat(70)}`);
console.log(`MAPPING CHANGES`);
console.log(`${'='.repeat(70)}\n`);
console.log(`Phoneme | Current | Optimized`);
console.log(`${'─'.repeat(35)}`);
for (const phoneme of allPhonemes) {
  if (bestMap[phoneme] !== ARPABET_TO_INGGLISH_MAP[phoneme]) {
    console.log(
      `  ${phoneme.padEnd(5)} | ${ARPABET_TO_INGGLISH_MAP[phoneme].padEnd(7)} | ${bestMap[phoneme]}`
    );
  }
}

// Show some examples of words that become identical
console.log(`\n${'='.repeat(70)}`);
console.log(`SAMPLE WORDS THAT BECOME IDENTICAL`);
console.log(`${'='.repeat(70)}\n`);

const newlyIdentical = optimized.identical.filter((w) => !current.identical.includes(w));
console.log(`${newlyIdentical.length} words become identical. Samples:`);
console.log(newlyIdentical.slice(0, 50).join(', '));

// Show trade-offs - words that become problematic
console.log(`\n${'='.repeat(70)}`);
console.log(`TRADE-OFFS AND PROBLEMS`);
console.log(`${'='.repeat(70)}\n`);

// Find homophones - different words that get same spelling
const spellings = new Map<string, string[]>();
for (const word of allWords) {
  const phonemes = cmudict[word];
  if (!phonemes) continue;
  const spelling = phonemesToSpelling(phonemes, bestMap);
  if (!spellings.has(spelling)) spellings.set(spelling, []);
  spellings.get(spelling)!.push(word);
}

const homophones = [...spellings.entries()]
  .filter(([_, words]) => words.length > 1)
  .map(([spelling, words]) => ({ spelling, words }))
  .slice(0, 20);

console.log(`Homophones created (same spelling, different words):`);
for (const { spelling, words } of homophones.slice(0, 15)) {
  if (words.length <= 4) {
    console.log(`  "${spelling}" ← ${words.join(', ')}`);
  }
}

// Show confusing pairs
console.log(`\nPotentially confusing with optimized mapping:`);
const confusing = [
  ['cup', 'cap'],
  ['cut', 'cat'],
  ['go', 'got'],
  ['so', 'saw'],
  ['zero', 'sero'],
];
for (const [w1, w2] of confusing) {
  const s1 = cmudict[w1] ? phonemesToSpelling(cmudict[w1], bestMap) : '?';
  const s2 = cmudict[w2] ? phonemesToSpelling(cmudict[w2], bestMap) : '?';
  console.log(`  ${w1} → ${s1}, ${w2} → ${s2} ${s1 === s2 ? '⚠️ COLLISION!' : ''}`);
}
