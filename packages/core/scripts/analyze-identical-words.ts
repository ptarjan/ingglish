/**
 * Analyze whether current phoneme mappings maximize identical words.
 * An "identical word" is one where the Ingglish spelling equals the English spelling.
 *
 * Run with: npx vite-node scripts/analyze-identical-words.ts
 */

import { loadDictionary, getDictionary } from '../src/dictionary/loader';
import { ARPABET_TO_INGGLISH_MAP } from '../src/convert/ingglish-maps';

// Load dictionary
await loadDictionary();
const cmudict = getDictionary();

// Get all words from the dictionary
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0);
console.log(`Total words in dictionary: ${allWords.length}`);

/**
 * Convert phonemes to Ingglish using a custom mapping
 */
function phonemesToIngglish(phonemes: string[], customMap: Record<string, string>): string {
  return phonemes
    .map((p) => {
      const base = p.replace(/[0-2]$/, '');
      return customMap[base] || ARPABET_TO_INGGLISH_MAP[base] || base.toLowerCase();
    })
    .join('');
}

/**
 * Count identical words using a custom mapping override
 */
function countIdenticalWithMapping(override: Record<string, string>): {
  count: number;
  examples: string[];
} {
  const customMap = { ...ARPABET_TO_INGGLISH_MAP, ...override };
  let count = 0;
  const examples: string[] = [];

  for (const word of allWords) {
    const phonemes = cmudict[word];
    if (!phonemes) continue;

    const ingglish = phonemesToIngglish(phonemes, customMap);
    if (ingglish.toLowerCase() === word.toLowerCase()) {
      count++;
      if (examples.length < 5) examples.push(word);
    }
  }

  return { count, examples };
}

// Current mappings baseline
const baseline = countIdenticalWithMapping({});
console.log(`\n${'='.repeat(70)}`);
console.log(
  `CURRENT MAPPINGS: ${baseline.count} identical words (${((baseline.count / allWords.length) * 100).toFixed(2)}%)`
);
console.log(`${'='.repeat(70)}`);

// Test alternative mappings for key phonemes
console.log(`\n${'='.repeat(70)}`);
console.log(`TESTING ALTERNATIVE MAPPINGS`);
console.log(`${'='.repeat(70)}`);

const alternatives: { phoneme: string; current: string; alternatives: string[] }[] = [
  // Vowels - these have the most variation in English spelling
  { phoneme: 'AH', current: 'u', alternatives: ['a', 'o', 'uh'] },
  { phoneme: 'IH', current: 'i', alternatives: ['e', 'y'] },
  { phoneme: 'EH', current: 'e', alternatives: ['a', 'ai'] },
  { phoneme: 'AE', current: 'a', alternatives: ['e', 'ai'] },
  { phoneme: 'AA', current: 'o', alternatives: ['a', 'ah'] },
  { phoneme: 'UH', current: 'oo', alternatives: ['u', 'o'] },
  { phoneme: 'IY', current: 'ee', alternatives: ['i', 'y', 'ie', 'e'] },
  { phoneme: 'EY', current: 'ay', alternatives: ['a', 'ai', 'ey'] },
  { phoneme: 'OW', current: 'oh', alternatives: ['o', 'ow'] },
  { phoneme: 'AO', current: 'aw', alternatives: ['o', 'au', 'a'] },

  // Consonants
  { phoneme: 'K', current: 'k', alternatives: ['c', 'ck'] },
  { phoneme: 'S', current: 's', alternatives: ['c', 'ss'] },
  { phoneme: 'Z', current: 'z', alternatives: ['s', 'zz'] },
  { phoneme: 'F', current: 'f', alternatives: ['ph', 'ff'] },
  { phoneme: 'JH', current: 'j', alternatives: ['g', 'dge'] },
];

console.log(`\nPhoneme | Current | Alt   | Current Count | Alt Count | Diff    | Winner`);
console.log(`${'─'.repeat(75)}`);

let totalPotentialGain = 0;
const improvements: { phoneme: string; from: string; to: string; gain: number }[] = [];

for (const { phoneme, current, alternatives: alts } of alternatives) {
  const currentResult = countIdenticalWithMapping({});

  for (const alt of alts) {
    const altResult = countIdenticalWithMapping({ [phoneme]: alt });
    const diff = altResult.count - currentResult.count;
    const winner = diff > 0 ? '← ALT' : diff < 0 ? 'CURRENT →' : 'TIE';

    console.log(
      `  ${phoneme.padEnd(5)} | ${current.padEnd(7)} | ${alt.padEnd(5)} | ${String(currentResult.count).padEnd(13)} | ${String(altResult.count).padEnd(9)} | ${(diff >= 0 ? '+' : '') + diff.toString().padEnd(7)} | ${winner}`
    );

    if (diff > 0) {
      totalPotentialGain += diff;
      improvements.push({ phoneme, from: current, to: alt, gain: diff });
    }
  }
}

console.log(`\n${'='.repeat(70)}`);
console.log(`SUMMARY`);
console.log(`${'='.repeat(70)}`);

if (improvements.length === 0) {
  console.log(`\n✓ VERIFIED: Current mappings are OPTIMAL for maximizing identical words.`);
  console.log(`  No alternative mapping produces more identical words.`);
} else {
  console.log(`\nPotential improvements found:`);
  improvements.sort((a, b) => b.gain - a.gain);
  for (const { phoneme, from, to, gain } of improvements.slice(0, 10)) {
    console.log(`  ${phoneme}: ${from} → ${to} would add ${gain} identical words`);
  }
  console.log(`\nTotal potential gain: ${totalPotentialGain} words`);
  console.log(`(Note: gains may not be additive - changing one may affect others)`);
}

console.log(
  `\nBaseline: ${baseline.count} identical words (${((baseline.count / allWords.length) * 100).toFixed(2)}%)`
);

// Test combining top improvements
console.log(`\n${'='.repeat(70)}`);
console.log(`TESTING COMBINED IMPROVEMENTS`);
console.log(`${'='.repeat(70)}`);

const combinedMappings = {
  OW: 'o', // +1200
  AH: 'a', // +782
  Z: 's', // +755
  AO: 'o', // +532
  AA: 'a', // +304
};

const combined = countIdenticalWithMapping(combinedMappings);
console.log(`\nWith combined "identical-maximizing" mappings:`);
console.log(`  OW→o, AH→a, Z→s, AO→o, AA→a`);
console.log(
  `  Result: ${combined.count} identical words (${((combined.count / allWords.length) * 100).toFixed(2)}%)`
);
console.log(`  Gain over current: +${combined.count - baseline.count} words`);

console.log(`\n${'='.repeat(70)}`);
console.log(`WHY DON'T WE USE THESE MAPPINGS?`);
console.log(`${'='.repeat(70)}`);
console.log(`
The current mappings prioritize OTHER goals over raw identical word count:

1. DISAMBIGUATION - Different sounds should look different
   - 'go' (OW) vs 'got' (AA) → goh vs got (current) vs go vs gat (alt)
   - Using 'o' for both OW and AA would create ambiguity

2. CONSISTENCY - Same sound should always look the same
   - Z→s would spell 'zero' as 'sero' but 'zebra' can't be 'sebra'

3. PHONETIC CLARITY - Spellings should match sounds
   - AH→a makes 'cup' → 'cap' (confusing with actual 'cap')
   - OW→o makes 'go' → 'go' (identical!) but loses the long-O marker

4. AVOIDING HOMOPHONES - Different words shouldn't become identical
   - Z→s might make 'prize' and 'prise' identical

CONCLUSION: The current mappings balance identical words with readability,
disambiguation, and consistency. Raw identical count isn't the only goal.
`);
