/**
 * Exhaustively search for ALL safe mapping improvements.
 * Optimized: only recompute words affected by a phoneme change.
 * Supports stress-conditioned overrides (e.g. AH0→'a' vs AH1/2→'u').
 */

import { loadDictionary, getDictionary } from '@ingglish/dictionary';
import { ARPABET_TO_INGGLISH_MAP } from '@ingglish/phonemes';

await loadDictionary();
const cmudict = getDictionary();
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0);

function stripStress(phoneme: string): string {
  return phoneme.replace(/[0-2]$/, '');
}

// Pre-compute raw phonemes (with stress) and base phonemes (stress stripped)
const wordRawPhonemes = new Map<string, string[]>();
const wordBasePhonemes = new Map<string, string[]>();
for (const word of allWords) {
  const phonemes = cmudict[word];
  if (phonemes) {
    wordRawPhonemes.set(word, phonemes);
    wordBasePhonemes.set(
      word,
      phonemes.map((p) => stripStress(p))
    );
  }
}

// Baseline stress overrides reflecting what arpabetToIngglish() actually does
const baselineStressOverrides: Record<string, string> = { AH0: 'a' };

function phonemesToSpelling(
  rawPhonemes: string[],
  map: Record<string, string>,
  stressOverrides?: Record<string, string>
): string {
  return rawPhonemes
    .map((p) => {
      if (stressOverrides && p in stressOverrides) return stressOverrides[p];
      const base = stripStress(p);
      return map[base] || base.toLowerCase();
    })
    .join('');
}

function getCollisionCount(
  map: Record<string, string>,
  stressOverrides?: Record<string, string>
): number {
  const spellingToWords = new Map<string, Set<string>>();
  for (const word of allWords) {
    const rawPhonemes = wordRawPhonemes.get(word);
    if (!rawPhonemes) continue;
    const spelling = phonemesToSpelling(rawPhonemes, map, stressOverrides);
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

// Pre-compute which words contain each base phoneme (for incremental updates)
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

// Pre-compute which words contain each raw phoneme (for stress-aware search)
const wordsWithRawPhoneme = new Map<string, string[]>();
for (const word of allWords) {
  const raw = wordRawPhonemes.get(word);
  if (!raw) continue;
  const seen = new Set<string>();
  for (const p of raw) {
    if (!seen.has(p)) {
      if (!wordsWithRawPhoneme.has(p)) wordsWithRawPhoneme.set(p, []);
      wordsWithRawPhoneme.get(p)!.push(word);
      seen.add(p);
    }
  }
}

// Pre-compute baseline identical words and their spellings
const baselineSpellings = new Map<string, string>();
const baselineIdentical = new Set<string>();
for (const word of allWords) {
  const rawPhonemes = wordRawPhonemes.get(word);
  if (!rawPhonemes) continue;
  const spelling = phonemesToSpelling(
    rawPhonemes,
    ARPABET_TO_INGGLISH_MAP,
    baselineStressOverrides
  );
  baselineSpellings.set(word, spelling);
  if (spelling.toLowerCase() === word.toLowerCase()) baselineIdentical.add(word);
}

// Fast incremental check for base phoneme changes
function getIdenticalDelta(
  phoneme: string,
  newValue: string
): { gained: string[]; lost: string[]; netGain: number } {
  const affected = wordsWithPhoneme.get(phoneme) || [];
  const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: newValue };
  const gained: string[] = [];
  const lost: string[] = [];

  for (const word of affected) {
    const rawPhonemes = wordRawPhonemes.get(word)!;
    const newSpelling = phonemesToSpelling(rawPhonemes, testMap, baselineStressOverrides);
    const wasIdentical = baselineIdentical.has(word);
    const isIdentical = newSpelling.toLowerCase() === word.toLowerCase();

    if (!wasIdentical && isIdentical) gained.push(word);
    if (wasIdentical && !isIdentical) lost.push(word);
  }

  return { gained, lost, netGain: gained.length - lost.length };
}

// Incremental check for stress-specific changes
function getStressIdenticalDelta(
  rawPhoneme: string,
  newValue: string
): { gained: string[]; lost: string[]; netGain: number } {
  const affected = wordsWithRawPhoneme.get(rawPhoneme) || [];
  const testOverrides = { ...baselineStressOverrides, [rawPhoneme]: newValue };
  const gained: string[] = [];
  const lost: string[] = [];

  for (const word of affected) {
    const rawPhonemes = wordRawPhonemes.get(word)!;
    const newSpelling = phonemesToSpelling(rawPhonemes, ARPABET_TO_INGGLISH_MAP, testOverrides);
    const wasIdentical = baselineIdentical.has(word);
    const isIdentical = newSpelling.toLowerCase() === word.toLowerCase();

    if (!wasIdentical && isIdentical) gained.push(word);
    if (wasIdentical && !isIdentical) lost.push(word);
  }

  return { gained, lost, netGain: gained.length - lost.length };
}

// Full identical words check (only used for final reporting)
function getIdenticalWords(
  map: Record<string, string>,
  stressOverrides?: Record<string, string>
): Set<string> {
  const identical = new Set<string>();
  for (const word of allWords) {
    const rawPhonemes = wordRawPhonemes.get(word);
    if (!rawPhonemes) continue;
    const spelling = phonemesToSpelling(rawPhonemes, map, stressOverrides);
    if (spelling.toLowerCase() === word.toLowerCase()) identical.add(word);
  }
  return identical;
}

const baselineCollisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP, baselineStressOverrides);

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

// ============================================================
// PHASE 1: Base phoneme search (stress-aware baseline)
// ============================================================

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
    const collisions = getCollisionCount(testMap, baselineStressOverrides);
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
console.log(`ALL SAFE BASE IMPROVEMENTS FOUND: ${improvements.length}`);
console.log(`${'='.repeat(60)}\n`);

if (improvements.length === 0) {
  console.log('No base improvements possible without creating new collisions.');
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
  console.log(`DETAILS FOR TOP BASE IMPROVEMENTS`);
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

// ============================================================
// PHASE 2: Stress-conditioned search
// ============================================================

console.log(`\n${'='.repeat(60)}`);
console.log(`STRESS-CONDITIONED IMPROVEMENTS`);
console.log(`${'='.repeat(60)}\n`);

// Find all stress-0 vowel phonemes present in the dictionary
const stress0Phonemes = new Set<string>();
for (const word of allWords) {
  const raw = wordRawPhonemes.get(word);
  if (!raw) continue;
  for (const p of raw) {
    if (p.endsWith('0')) stress0Phonemes.add(p);
  }
}

console.log(
  `Found ${stress0Phonemes.size} stress-0 phonemes: ${[...stress0Phonemes].sort().join(', ')}\n`
);

const stressImprovements: {
  rawPhoneme: string;
  basePhoneme: string;
  from: string;
  to: string;
  netGain: number;
  gained: string[];
  lost: string[];
}[] = [];

let stressTested = 0;
let stressSkippedNotBetter = 0;
let stressSkippedCollisions = 0;

const sortedStress0 = [...stress0Phonemes].sort();
for (let si = 0; si < sortedStress0.length; si++) {
  const rawPhoneme = sortedStress0[si];
  const basePhoneme = stripStress(rawPhoneme);
  const currentSpelling =
    baselineStressOverrides[rawPhoneme] ?? ARPABET_TO_INGGLISH_MAP[basePhoneme];
  const progressPct = (((si + 1) / sortedStress0.length) * 100).toFixed(0);
  process.stdout.write(
    `\r[${progressPct}%] Testing ${rawPhoneme.padEnd(4)} (${si + 1}/${sortedStress0.length})...`
  );

  for (const option of allOptions) {
    if (option === currentSpelling) continue;
    stressTested++;

    const delta = getStressIdenticalDelta(rawPhoneme, option);

    if (delta.netGain <= 0) {
      stressSkippedNotBetter++;
      continue;
    }

    const testOverrides = { ...baselineStressOverrides, [rawPhoneme]: option };
    const collisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP, testOverrides);
    if (collisions > baselineCollisions) {
      stressSkippedCollisions++;
      continue;
    }

    stressImprovements.push({
      rawPhoneme,
      basePhoneme,
      from: currentSpelling,
      to: option,
      netGain: delta.netGain,
      gained: delta.gained,
      lost: delta.lost,
    });
  }
}
console.log(); // newline after progress

console.log(`\nTested ${stressTested} stress-conditioned combinations:`);
console.log(`  - ${stressSkippedNotBetter} skipped (not better)`);
console.log(`  - ${stressSkippedCollisions} skipped (would add collisions)`);
console.log(`  - ${stressImprovements.length} valid improvements found`);

stressImprovements.sort((a, b) => b.netGain - a.netGain);

if (stressImprovements.length === 0) {
  console.log('\nNo stress-conditioned improvements found.');
} else {
  console.log('\nRaw Ph. | Base | Current | Better  | Net Gain | Gained | Lost');
  console.log('─'.repeat(65));
  for (const { rawPhoneme, basePhoneme, from, to, netGain, gained, lost } of stressImprovements) {
    console.log(
      `  ${rawPhoneme.padEnd(5)} | ${basePhoneme.padEnd(4)} | ${from.padEnd(7)} | ${to.padEnd(7)} | +${String(netGain).padEnd(6)} | +${String(gained.length).padEnd(5)} | -${lost.length}`
    );
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`DETAILS FOR TOP STRESS-CONDITIONED IMPROVEMENTS`);
  console.log(`${'='.repeat(60)}`);
  for (const { rawPhoneme, from, to, netGain, gained, lost } of stressImprovements.slice(0, 5)) {
    console.log(`\n${rawPhoneme}: "${from}" → "${to}" (net +${netGain})`);
    console.log(
      `  Gained (${gained.length}): ${gained.slice(0, 20).join(', ')}${gained.length > 20 ? '...' : ''}`
    );
    console.log(
      `  Lost (${lost.length}): ${lost.slice(0, 20).join(', ')}${lost.length > 20 ? '...' : ''}`
    );
  }
}

// ============================================================
// PHASE 3: Test combinations (base + stress-conditioned)
// ============================================================

console.log(`\n${'='.repeat(60)}`);
console.log(`TESTING COMBINATIONS`);
console.log(`${'='.repeat(60)}\n`);

// Merge all improvements into a unified list sorted by netGain
type UnifiedImprovement = {
  type: 'base' | 'stress';
  key: string; // base phoneme or raw phoneme
  from: string;
  to: string;
  netGain: number;
  gained: string[];
  lost: string[];
};

const allImprovements: UnifiedImprovement[] = [
  ...improvements.map((imp) => ({
    type: 'base' as const,
    key: imp.phoneme,
    from: imp.from,
    to: imp.to,
    netGain: imp.netGain,
    gained: imp.gained,
    lost: imp.lost,
  })),
  ...stressImprovements.map((imp) => ({
    type: 'stress' as const,
    key: imp.rawPhoneme,
    from: imp.from,
    to: imp.to,
    netGain: imp.netGain,
    gained: imp.gained,
    lost: imp.lost,
  })),
];
allImprovements.sort((a, b) => b.netGain - a.netGain);

// Apply all non-conflicting improvements (one per phoneme, best first)
let bestMap = { ...ARPABET_TO_INGGLISH_MAP };
let bestStressOverrides = { ...baselineStressOverrides };
const appliedChanges: UnifiedImprovement[] = [];
const basePhonemesSeen = new Set<string>();
const stressPhonemesSeen = new Set<string>();

for (const imp of allImprovements) {
  if (imp.type === 'base') {
    if (basePhonemesSeen.has(imp.key)) continue;

    const testMap = { ...bestMap, [imp.key]: imp.to };
    const collisions = getCollisionCount(testMap, bestStressOverrides);

    if (collisions <= baselineCollisions) {
      bestMap[imp.key] = imp.to;
      appliedChanges.push(imp);
      basePhonemesSeen.add(imp.key);
      console.log(`✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (+${imp.netGain})`);
    } else {
      console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (would add collisions)`);
    }
  } else {
    if (stressPhonemesSeen.has(imp.key)) continue;

    const testOverrides = { ...bestStressOverrides, [imp.key]: imp.to };
    const collisions = getCollisionCount(bestMap, testOverrides);

    if (collisions <= baselineCollisions) {
      bestStressOverrides[imp.key] = imp.to;
      appliedChanges.push(imp);
      stressPhonemesSeen.add(imp.key);
      console.log(`✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (+${imp.netGain}) [stress]`);
    } else {
      console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (would add collisions) [stress]`);
    }
  }
}

const finalIdentical = getIdenticalWords(bestMap, bestStressOverrides);
const finalCollisions = getCollisionCount(bestMap, bestStressOverrides);

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
for (const imp of appliedChanges) {
  const label = imp.type === 'stress' ? ' [stress-conditioned]' : '';
  console.log(
    `  ${imp.key}: "${imp.from}" → "${imp.to}" (+${imp.gained.length} gained, -${imp.lost.length} lost = net +${imp.netGain})${label}`
  );
}
