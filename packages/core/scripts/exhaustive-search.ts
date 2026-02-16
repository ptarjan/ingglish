/**
 * Exhaustively search for ALL safe mapping improvements.
 * Optimized: only recompute words affected by a phoneme change.
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';
import { ARPABET_TO_INGGLISH_MAP } from '@ingglish/phonemes';

await loadDictionary();
const cmudict = getDictionary();
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0);

// Pre-compute base phonemes (strip stress markers once)
const wordBasePhonemes = new Map<string, string[]>();
for (const word of allWords) {
  const phonemes = cmudict[word];
  if (phonemes) {
    wordBasePhonemes.set(
      word,
      phonemes.map((p) => p.replace(/[0-2]$/, ''))
    );
  }
}

function phonemesToSpelling(basePhonemes: string[], map: Record<string, string>): string {
  return basePhonemes.map((p) => map[p] || p.toLowerCase()).join('');
}

function getCollisionCount(map: Record<string, string>): number {
  const spellingToWords = new Map<string, Set<string>>();
  for (const word of allWords) {
    const basePhonemes = wordBasePhonemes.get(word);
    if (!basePhonemes) continue;
    const spelling = phonemesToSpelling(basePhonemes, map);
    const baseWord = word.replace(/\(\d+\)$/, '');
    if (!spellingToWords.has(spelling)) spellingToWords.set(spelling, new Set());
    spellingToWords.get(spelling)!.add(baseWord);
  }
  let collisions = 0;
  for (const words of spellingToWords.values()) {
    if (words.size > 1) collisions += words.size - 1;
  }
  return collisions;
}

// Pre-compute which words contain each phoneme (for incremental updates)
const wordsWithPhoneme = new Map<string, string[]>();
for (const phoneme of Object.keys(ARPABET_TO_INGGLISH_MAP)) {
  wordsWithPhoneme.set(phoneme, []);
}
for (const word of allWords) {
  const basePhonemes = wordBasePhonemes.get(word);
  if (!basePhonemes) continue;
  const seen = new Set<string>();
  for (const base of basePhonemes) {
    if (!seen.has(base) && wordsWithPhoneme.has(base)) {
      wordsWithPhoneme.get(base)!.push(word);
      seen.add(base);
    }
  }
}

// Pre-compute baseline identical words and their spellings
const baselineSpellings = new Map<string, string>();
const baselineIdentical = new Set<string>();
for (const word of allWords) {
  const basePhonemes = wordBasePhonemes.get(word);
  if (!basePhonemes) continue;
  const spelling = phonemesToSpelling(basePhonemes, ARPABET_TO_INGGLISH_MAP);
  baselineSpellings.set(word, spelling);
  if (spelling.toLowerCase() === word.toLowerCase()) baselineIdentical.add(word);
}

// Fast incremental check: only recompute affected words
function getIdenticalDelta(
  phoneme: string,
  newValue: string
): { gained: string[]; lost: string[]; netGain: number } {
  const affected = wordsWithPhoneme.get(phoneme) || [];
  const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: newValue };
  const gained: string[] = [];
  const lost: string[] = [];

  for (const word of affected) {
    const basePhonemes = wordBasePhonemes.get(word)!;
    const newSpelling = phonemesToSpelling(basePhonemes, testMap);
    const wasIdentical = baselineIdentical.has(word);
    const isIdentical = newSpelling.toLowerCase() === word.toLowerCase();

    if (!wasIdentical && isIdentical) gained.push(word);
    if (wasIdentical && !isIdentical) lost.push(word);
  }

  return { gained, lost, netGain: gained.length - lost.length };
}

// Full identical words check (only used for final reporting)
function getIdenticalWords(map: Record<string, string>): Set<string> {
  const identical = new Set<string>();
  for (const word of allWords) {
    const basePhonemes = wordBasePhonemes.get(word);
    if (!basePhonemes) continue;
    const spelling = phonemesToSpelling(basePhonemes, map);
    if (spelling.toLowerCase() === word.toLowerCase()) identical.add(word);
  }
  return identical;
}

const baselineCollisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP);

console.log(`Baseline: ${baselineIdentical.size} identical, ${baselineCollisions} collisions\n`);

// Generate ALL possible single-character and two-character options
const allChars = 'abcdefghijklmnopqrstuvwxyz'.split('');
const allDigraphs = [
  'th',
  'sh',
  'ch',
  'ng',
  'zh',
  'dh',
  'ph',
  'wh',
  'ck',
  'gh',
  'aa',
  'ae',
  'ai',
  'ao',
  'au',
  'aw',
  'ay',
  'ea',
  'ee',
  'ei',
  'eo',
  'er',
  'eu',
  'ew',
  'ey',
  'ia',
  'ie',
  'io',
  'ir',
  'oa',
  'oe',
  'oi',
  'oo',
  'or',
  'ou',
  'ow',
  'oy',
  'ua',
  'ue',
  'ui',
  'uo',
  'ur',
  'uu',
  'uy',
];
const allOptions = [...allChars, ...allDigraphs];

const phonemes = Object.keys(ARPABET_TO_INGGLISH_MAP);
const totalTests = phonemes.length * allOptions.length;
console.log(
  `Testing ${phonemes.length} phonemes × ${allOptions.length} options = ${totalTests} combinations...\n`
);

// Test EVERY phoneme with EVERY option (with early exit optimization)
const improvements: {
  phoneme: string;
  from: string;
  to: string;
  netGain: number;
  gained: string[];
  lost: string[];
}[] = [];
let tested = 0;
let skippedNotBetter = 0;
let skippedCollisions = 0;

for (let pi = 0; pi < phonemes.length; pi++) {
  const phoneme = phonemes[pi];
  const current = ARPABET_TO_INGGLISH_MAP[phoneme];
  const progressPct = (((pi + 1) / phonemes.length) * 100).toFixed(0);
  process.stdout.write(
    `\r[${progressPct}%] Testing ${phoneme.padEnd(3)} (${pi + 1}/${phonemes.length})...`
  );

  for (const option of allOptions) {
    if (option === current) continue;
    tested++;

    // Fast incremental check - only looks at words with this phoneme
    const delta = getIdenticalDelta(phoneme, option);

    // EARLY EXIT: Skip if not better
    if (delta.netGain <= 0) {
      skippedNotBetter++;
      continue;
    }

    // Only compute expensive collision check if identical improved
    const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: option };
    const collisions = getCollisionCount(testMap);
    if (collisions > baselineCollisions) {
      skippedCollisions++;
      continue;
    }

    improvements.push({
      phoneme,
      from: current,
      to: option,
      netGain: delta.netGain,
      gained: delta.gained,
      lost: delta.lost,
    });
  }
}
console.log(); // newline after progress

console.log(`\nTested ${tested} combinations:`);
console.log(`  - ${skippedNotBetter} skipped (not better)`);
console.log(`  - ${skippedCollisions} skipped (would add collisions)`);
console.log(`  - ${improvements.length} valid improvements found`);

// Sort by net gain
improvements.sort((a, b) => b.netGain - a.netGain);

console.log(`\n${'='.repeat(60)}`);
console.log(`ALL SAFE IMPROVEMENTS FOUND: ${improvements.length}`);
console.log(`${'='.repeat(60)}\n`);

if (improvements.length === 0) {
  console.log('No improvements possible without creating new collisions.');
} else {
  console.log('Phoneme | Current | Better  | Net Gain | Gained | Lost');
  console.log('─'.repeat(60));
  for (const { phoneme, from, to, netGain, gained, lost } of improvements) {
    console.log(
      `  ${phoneme.padEnd(5)} | ${from.padEnd(7)} | ${to.padEnd(7)} | +${String(netGain).padEnd(6)} | +${String(gained.length).padEnd(5)} | -${lost.length}`
    );
  }

  // Show sample gained/lost words for top improvements
  console.log(`\n${'='.repeat(60)}`);
  console.log(`DETAILS FOR TOP IMPROVEMENTS`);
  console.log(`${'='.repeat(60)}`);
  for (const { phoneme, from, to, netGain, gained, lost } of improvements.slice(0, 5)) {
    console.log(`\n${phoneme}: "${from}" → "${to}" (net +${netGain})`);
    console.log(
      `  Gained (${gained.length}): ${gained.slice(0, 20).join(', ')}${gained.length > 20 ? '...' : ''}`
    );
    console.log(
      `  Lost (${lost.length}): ${lost.slice(0, 20).join(', ')}${lost.length > 20 ? '...' : ''}`
    );
  }
}

// Now test if these improvements can be combined
console.log(`\n${'='.repeat(60)}`);
console.log(`TESTING COMBINATIONS`);
console.log(`${'='.repeat(60)}\n`);

// Apply all non-conflicting improvements (one per phoneme, best first)
let bestMap = { ...ARPABET_TO_INGGLISH_MAP };
const appliedChanges: typeof improvements = [];
const phonemesSeen = new Set<string>();

for (const imp of improvements) {
  // Skip if we already changed this phoneme
  if (phonemesSeen.has(imp.phoneme)) continue;

  const testMap = { ...bestMap, [imp.phoneme]: imp.to };
  const collisions = getCollisionCount(testMap);

  if (collisions <= baselineCollisions) {
    bestMap[imp.phoneme] = imp.to;
    appliedChanges.push(imp);
    phonemesSeen.add(imp.phoneme);
    console.log(`✓ Applied ${imp.phoneme}: ${imp.from} → ${imp.to} (+${imp.netGain})`);
  } else {
    console.log(`✗ Skipped ${imp.phoneme}: ${imp.from} → ${imp.to} (would add collisions)`);
  }
}

const finalIdentical = getIdenticalWords(bestMap);
const finalCollisions = getCollisionCount(bestMap);

console.log(`\n${'='.repeat(60)}`);
console.log(`FINAL RESULT`);
console.log(`${'='.repeat(60)}`);
console.log(
  `\nBefore: ${baselineIdentical.size} identical (${((baselineIdentical.size / allWords.length) * 100).toFixed(2)}%)`
);
console.log(
  `After:  ${finalIdentical.size} identical (${((finalIdentical.size / allWords.length) * 100).toFixed(2)}%)`
);
console.log(`Gain:   +${finalIdentical.size - baselineIdentical.size} words`);
console.log(`\nCollisions: ${finalCollisions} (was ${baselineCollisions})`);

console.log(`\n${'='.repeat(60)}`);
console.log(`RECOMMENDED CHANGES`);
console.log(`${'='.repeat(60)}\n`);
for (const { phoneme, from, to, netGain, gained, lost } of appliedChanges) {
  console.log(
    `  ${phoneme}: "${from}" → "${to}" (+${gained.length} gained, -${lost.length} lost = net +${netGain})`
  );
}
