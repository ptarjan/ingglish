#!/usr/bin/env npx vite-node
/**
 * Exhaustively search for mapping improvements using spelling familiarity.
 *
 * Spelling familiarity = for each phoneme→grapheme mapping, what fraction of
 * English words containing that phoneme also contain the grapheme as a substring?
 * Frequency-weighted across all phoneme occurrences.
 *
 * This metric captures how "English-looking" each spelling choice is by measuring
 * whether English readers already associate that grapheme with that sound.
 */

import {
  loadDictionary,
  getDictionary,
  loadFrequencies,
  getWordFrequency,
} from '@ingglish/dictionary';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD, stripStress } from '@ingglish/phonemes';

const [, freqData] = await Promise.all([loadDictionary(), loadFrequencies()]);
const cmudict = getDictionary();
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0);
const corpusTotal = Object.values(freqData).reduce((sum, v) => sum + v, 0);
const perMillion = (raw: number) => (raw / corpusTotal) * 1_000_000;

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

// ============================================================
// Spelling familiarity metric
// ============================================================

/**
 * Get grapheme units for a phoneme sequence under given mappings.
 * R-colored vowels merge vowel+R into a single unit (e.g., "ar").
 */
function getGraphemeUnits(
  rawPhonemes: string[],
  phonemeMap: Record<string, string>,
  rColoredForward: Map<string, string>,
  stressOverrides: Record<string, string>
): string[] {
  const units: string[] = [];
  const len = rawPhonemes.length;
  let skipNext = false;

  for (let i = 0; i < len; i++) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    const p = rawPhonemes[i]!;
    const base = stripStress(p);

    // R-colored vowel: combine vowel+R into single grapheme unit
    if (i + 1 < len && rawPhonemes[i + 1] === 'R') {
      const rPrefix = rColoredForward.get(base);
      if (rPrefix !== undefined) {
        units.push(rPrefix + (phonemeMap.R ?? 'r'));
        skipNext = true;
        continue;
      }
    }

    // Stress override (e.g., AH0 → 'a')
    if (p in stressOverrides) {
      // But R-colored override takes precedence: AH0+R → 'uhr' not 'ar'
      if (i + 1 < len && rawPhonemes[i + 1] === 'R') {
        const rPrefix = rColoredForward.get(base);
        if (rPrefix !== undefined) {
          units.push(rPrefix + (phonemeMap.R ?? 'r'));
          skipNext = true;
          continue;
        }
      }
      units.push(stressOverrides[p]!);
      continue;
    }

    // Base mapping
    units.push(phonemeMap[base] ?? base.toLowerCase());
  }

  return units;
}

/**
 * Compute corpus-level spelling familiarity score.
 * Returns both the raw frequency sum and the total frequency.
 */
function computeFamiliarity(
  map: Record<string, string>,
  stressOverrides: Record<string, string>,
  rColoredForward: Map<string, string>
): { familiarityFreqSum: number; totalFreqSum: number; pct: number } {
  let familiarityFreqSum = 0;
  let totalFreqSum = 0;

  for (const word of allWords) {
    const rawPhonemes = wordRawPhonemes.get(word);
    if (!rawPhonemes) {
      continue;
    }
    const freq = getWordFrequency(word) ?? 0;
    totalFreqSum += freq;

    const units = getGraphemeUnits(rawPhonemes, map, rColoredForward, stressOverrides);
    if (units.length > 0) {
      let hits = 0;
      for (const g of units) {
        if (word.toLowerCase().includes(g)) {
          hits++;
        }
      }
      familiarityFreqSum += freq * (hits / units.length);
    }
  }

  return {
    familiarityFreqSum,
    totalFreqSum,
    pct: totalFreqSum > 0 ? (familiarityFreqSum / totalFreqSum) * 100 : 100,
  };
}

/**
 * Compute familiarity delta for a single base phoneme change.
 * Only re-evaluates words containing the changed phoneme.
 */
function getFamiliarityDelta(
  phoneme: string,
  newValue: string,
  wordsWithPhoneme: string[]
): { delta: number; newPct: number } {
  const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: newValue };
  let baselineHitSum = 0;
  let testHitSum = 0;
  let affectedFreqSum = 0;

  for (const word of wordsWithPhoneme) {
    const rawPhonemes = wordRawPhonemes.get(word);
    if (!rawPhonemes) {
      continue;
    }
    const freq = getWordFrequency(word) ?? 0;
    affectedFreqSum += freq;
    const wordLower = word.toLowerCase();

    // Baseline familiarity for this word
    const baseUnits = getGraphemeUnits(
      rawPhonemes,
      ARPABET_TO_INGGLISH_MAP,
      R_COLORED_FORWARD,
      baselineStressOverrides
    );
    if (baseUnits.length > 0) {
      let hits = 0;
      for (const g of baseUnits) {
        if (wordLower.includes(g)) {
          hits++;
        }
      }
      baselineHitSum += freq * (hits / baseUnits.length);
    }

    // Test familiarity for this word
    const testUnits = getGraphemeUnits(
      rawPhonemes,
      testMap,
      R_COLORED_FORWARD,
      baselineStressOverrides
    );
    if (testUnits.length > 0) {
      let hits = 0;
      for (const g of testUnits) {
        if (wordLower.includes(g)) {
          hits++;
        }
      }
      testHitSum += freq * (hits / testUnits.length);
    }
  }

  const delta = testHitSum - baselineHitSum;
  // Compute new overall familiarity by adjusting baseline
  const newPct =
    baselineFamiliarity.totalFreqSum > 0
      ? ((baselineFamiliarity.familiarityFreqSum + delta) / baselineFamiliarity.totalFreqSum) * 100
      : 100;

  return { delta, newPct };
}

/**
 * Compute familiarity delta for a stress-conditioned change.
 */
function getStressFamiliarityDelta(
  rawPhoneme: string,
  newValue: string,
  wordsWithRawPhoneme: string[]
): { delta: number; newPct: number } {
  const testOverrides = { ...baselineStressOverrides, [rawPhoneme]: newValue };
  let baselineHitSum = 0;
  let testHitSum = 0;

  for (const word of wordsWithRawPhoneme) {
    const rawPhonemes = wordRawPhonemes.get(word);
    if (!rawPhonemes) {
      continue;
    }
    const freq = getWordFrequency(word) ?? 0;
    const wordLower = word.toLowerCase();

    // Baseline
    const baseUnits = getGraphemeUnits(
      rawPhonemes,
      ARPABET_TO_INGGLISH_MAP,
      R_COLORED_FORWARD,
      baselineStressOverrides
    );
    if (baseUnits.length > 0) {
      let hits = 0;
      for (const g of baseUnits) {
        if (wordLower.includes(g)) {
          hits++;
        }
      }
      baselineHitSum += freq * (hits / baseUnits.length);
    }

    // Test
    const testUnits = getGraphemeUnits(
      rawPhonemes,
      ARPABET_TO_INGGLISH_MAP,
      R_COLORED_FORWARD,
      testOverrides
    );
    if (testUnits.length > 0) {
      let hits = 0;
      for (const g of testUnits) {
        if (wordLower.includes(g)) {
          hits++;
        }
      }
      testHitSum += freq * (hits / testUnits.length);
    }
  }

  const delta = testHitSum - baselineHitSum;
  const newPct =
    baselineFamiliarity.totalFreqSum > 0
      ? ((baselineFamiliarity.familiarityFreqSum + delta) / baselineFamiliarity.totalFreqSum) * 100
      : 100;

  return { delta, newPct };
}

// Pre-compute which words contain each base phoneme
const wordsWithPhoneme = new Map<string, string[]>();
for (const phoneme of Object.keys(ARPABET_TO_INGGLISH_MAP)) {
  wordsWithPhoneme.set(phoneme, []);
}
for (const word of allWords) {
  const basePhonemes = wordBasePhonemes.get(word);
  if (!basePhonemes) {
    continue;
  }
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
  if (!raw) {
    continue;
  }
  const seen = new Set<string>();
  for (const p of raw) {
    if (!seen.has(p)) {
      if (!wordsWithRawPhoneme.has(p)) {
        wordsWithRawPhoneme.set(p, []);
      }
      wordsWithRawPhoneme.get(p)!.push(word);
      seen.add(p);
    }
  }
}

// Compute baseline familiarity
const baselineFamiliarity = computeFamiliarity(
  ARPABET_TO_INGGLISH_MAP,
  baselineStressOverrides,
  R_COLORED_FORWARD
);

console.log(`Baseline spelling familiarity: ${baselineFamiliarity.pct.toFixed(2)}%`);
console.log(
  `Frequency unit: per million words of text (SUBTLEX-US, ${(corpusTotal / 1_000_000).toFixed(1)}M word corpus)\n`
);

// Show per-phoneme familiarity scores
console.log(`${'='.repeat(70)}`);
console.log('PER-PHONEME FAMILIARITY SCORES');
console.log(`${'='.repeat(70)}\n`);

const phonemeScores: { phoneme: string; grapheme: string; consistency: number; weight: number }[] =
  [];
for (const [phoneme, grapheme] of Object.entries(ARPABET_TO_INGGLISH_MAP)) {
  const words = wordsWithPhoneme.get(phoneme) ?? [];
  let hitFreq = 0;
  let totalFreq = 0;
  for (const word of words) {
    const freq = getWordFrequency(word) ?? 0;
    totalFreq += freq;
    if (word.toLowerCase().includes(grapheme)) {
      hitFreq += freq;
    }
  }
  const consistency = totalFreq > 0 ? hitFreq / totalFreq : 0;
  phonemeScores.push({ phoneme, grapheme, consistency, weight: totalFreq });
}
phonemeScores.sort((a, b) => a.consistency - b.consistency);

console.log('Phoneme | Grapheme | Familiarity | Weight /M');
console.log('─'.repeat(50));
for (const { phoneme, grapheme, consistency, weight } of phonemeScores) {
  const pm = perMillion(weight);
  const pmStr = pm >= 1000 ? `${(pm / 1000).toFixed(0)}K` : pm.toFixed(0);
  console.log(
    `  ${phoneme.padEnd(5)} | ${grapheme.padEnd(8)} | ${(consistency * 100).toFixed(1).padStart(5)}%     | ${pmStr}`
  );
}

// ============================================================
// Collision check helper (same as exhaustive-search.ts)
// ============================================================

function phonemesToSpelling(
  rawPhonemes: string[],
  map: Record<string, string>,
  stressOverrides?: Record<string, string>
): string {
  let result = '';
  const len = rawPhonemes.length;
  for (let i = 0; i < len; i++) {
    const p = rawPhonemes[i]!;
    if (stressOverrides && p in stressOverrides) {
      if (i + 1 < len && rawPhonemes[i + 1] === 'R') {
        const base = stripStress(p);
        const rPrefix = R_COLORED_FORWARD.get(base);
        if (rPrefix !== undefined) {
          result += rPrefix;
          continue;
        }
      }
      result += stressOverrides[p];
      continue;
    }
    const base = stripStress(p);
    if (i + 1 < len && rawPhonemes[i + 1] === 'R') {
      const rPrefix = R_COLORED_FORWARD.get(base);
      if (rPrefix !== undefined) {
        result += rPrefix;
        continue;
      }
    }
    result += map[base] ?? base.toLowerCase();
  }
  return result;
}

function getCollisionCount(
  map: Record<string, string>,
  stressOverrides?: Record<string, string>
): number {
  const spellingToWords = new Map<string, Set<string>>();
  for (const word of allWords) {
    const rawPhonemes = wordRawPhonemes.get(word);
    if (!rawPhonemes) {
      continue;
    }
    const spelling = phonemesToSpelling(rawPhonemes, map, stressOverrides);
    const baseWord = word.replace(/\(\d+\)$/, '');
    if (!spellingToWords.has(spelling)) {
      spellingToWords.set(spelling, new Set());
    }
    spellingToWords.get(spelling)!.add(baseWord);
  }
  let collisions = 0;
  for (const words of spellingToWords.values()) {
    if (words.size > 1) {
      collisions += words.size - 1;
    }
  }
  return collisions;
}

/**
 * Check if a spelling would conflict with another phoneme's mapping.
 * Two different phonemes must not map to the same grapheme.
 */
function hasSpellingConflict(
  phoneme: string,
  newSpelling: string,
  map: Record<string, string>,
  stressOverrides: Record<string, string>
): boolean {
  // Check base map
  for (const [p, spelling] of Object.entries(map)) {
    if (p !== phoneme && spelling === newSpelling) {
      return true;
    }
  }
  // Check stress overrides
  for (const [p, spelling] of Object.entries(stressOverrides)) {
    if (p !== phoneme && spelling === newSpelling) {
      return true;
    }
  }
  return false;
}

const baselineCollisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP, baselineStressOverrides);
console.log(`\nBaseline collisions: ${baselineCollisions}`);

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

/** Format a raw frequency value as per-million */
function fmtPM(raw: number): string {
  const pm = perMillion(Math.abs(raw));
  if (pm >= 1000) {
    return `${(pm / 1000).toFixed(1)}K`;
  }
  if (pm >= 1) {
    return pm.toFixed(0);
  }
  if (pm >= 0.1) {
    return pm.toFixed(1);
  }
  if (Math.abs(raw) > 0) {
    return '<1';
  }
  return '0';
}

function signedPM(raw: number): string {
  if (raw === 0) {
    return '0';
  }
  return `${raw >= 0 ? '+' : '-'}${fmtPM(raw)}`;
}

// ============================================================
// PHASE 1: Base phoneme search
// ============================================================

const phonemes = Object.keys(ARPABET_TO_INGGLISH_MAP);
const totalTests = phonemes.length * allOptions.length;
console.log(
  `\nTesting ${phonemes.length} phonemes × ${allOptions.length} options = ${totalTests} combinations...\n`
);

type Improvement = {
  type: 'base' | 'stress';
  key: string;
  from: string;
  to: string;
  familiarityDelta: number;
  newFamiliarityPct: number;
};

const improvements: Improvement[] = [];
let tested = 0;
let skippedNotBetter = 0;
let skippedCollisions = 0;
let skippedConflicts = 0;

for (let pi = 0; pi < phonemes.length; pi++) {
  const phoneme = phonemes[pi]!;
  const current = ARPABET_TO_INGGLISH_MAP[phoneme]!;
  const affected = wordsWithPhoneme.get(phoneme) ?? [];
  const progressPct = (((pi + 1) / phonemes.length) * 100).toFixed(0);
  process.stdout.write(
    `\r[${progressPct}%] Testing ${phoneme.padEnd(3)} (${pi + 1}/${phonemes.length})...`
  );

  for (const option of allOptions) {
    if (option === current) {
      continue;
    }
    tested++;

    // Check phoneme uniqueness
    if (hasSpellingConflict(phoneme, option, ARPABET_TO_INGGLISH_MAP, baselineStressOverrides)) {
      skippedConflicts++;
      continue;
    }

    // Compute familiarity delta
    const { delta, newPct } = getFamiliarityDelta(phoneme, option, affected);

    if (delta <= 0) {
      skippedNotBetter++;
      continue;
    }

    // Check collisions
    const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: option };
    const collisions = getCollisionCount(testMap, baselineStressOverrides);
    if (collisions > baselineCollisions) {
      skippedCollisions++;
      continue;
    }

    improvements.push({
      type: 'base',
      key: phoneme,
      from: current,
      to: option,
      familiarityDelta: delta,
      newFamiliarityPct: newPct,
    });
  }
}
console.log(); // newline after progress

console.log(`\nTested ${tested} base combinations:`);
console.log(`  - ${skippedNotBetter} skipped (not better)`);
console.log(`  - ${skippedCollisions} skipped (would add collisions)`);
console.log(`  - ${skippedConflicts} skipped (spelling conflict)`);
console.log(`  - ${improvements.length} valid improvements found`);

improvements.sort((a, b) => b.familiarityDelta - a.familiarityDelta);

console.log(`\n${'='.repeat(80)}`);
console.log(`BASE IMPROVEMENTS (by familiarity delta)`);
console.log(`${'='.repeat(80)}\n`);

if (improvements.length === 0) {
  console.log('No base improvements possible.');
} else {
  console.log('Phoneme | Current | Better  | Delta /M    | New Familiarity %');
  console.log('─'.repeat(65));
  for (const imp of improvements.slice(0, 20)) {
    console.log(
      `  ${imp.key.padEnd(5)} | ${imp.from.padEnd(7)} | ${imp.to.padEnd(7)} | ${signedPM(imp.familiarityDelta).padEnd(11)} | ${imp.newFamiliarityPct.toFixed(2)}%`
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
  if (!raw) {
    continue;
  }
  for (const p of raw) {
    if (p.endsWith('0')) {
      stress0Phonemes.add(p);
    }
  }
}

console.log(
  `Found ${stress0Phonemes.size} stress-0 phonemes: ${[...stress0Phonemes].sort().join(', ')}\n`
);

const stressImprovements: Improvement[] = [];
let stressTested = 0;
let stressSkippedNotBetter = 0;
let stressSkippedCollisions = 0;
let stressSkippedConflicts = 0;

const sortedStress0 = [...stress0Phonemes].sort();
for (let si = 0; si < sortedStress0.length; si++) {
  const rawPhoneme = sortedStress0[si]!;
  const basePhoneme = stripStress(rawPhoneme);
  const currentSpelling =
    baselineStressOverrides[rawPhoneme] ?? ARPABET_TO_INGGLISH_MAP[basePhoneme];
  const affected = wordsWithRawPhoneme.get(rawPhoneme) ?? [];
  const progressPct = (((si + 1) / sortedStress0.length) * 100).toFixed(0);
  process.stdout.write(
    `\r[${progressPct}%] Testing ${rawPhoneme.padEnd(4)} (${si + 1}/${sortedStress0.length})...`
  );

  for (const option of allOptions) {
    if (option === currentSpelling) {
      continue;
    }
    stressTested++;

    // Check phoneme uniqueness
    if (hasSpellingConflict(rawPhoneme, option, ARPABET_TO_INGGLISH_MAP, baselineStressOverrides)) {
      stressSkippedConflicts++;
      continue;
    }

    const { delta, newPct } = getStressFamiliarityDelta(rawPhoneme, option, affected);

    if (delta <= 0) {
      stressSkippedNotBetter++;
      continue;
    }

    // Check collisions
    const testOverrides = { ...baselineStressOverrides, [rawPhoneme]: option };
    const collisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP, testOverrides);
    if (collisions > baselineCollisions) {
      stressSkippedCollisions++;
      continue;
    }

    stressImprovements.push({
      type: 'stress',
      key: rawPhoneme,
      from: currentSpelling!,
      to: option,
      familiarityDelta: delta,
      newFamiliarityPct: newPct,
    });
  }
}
console.log(); // newline after progress

console.log(`\nTested ${stressTested} stress-conditioned combinations:`);
console.log(`  - ${stressSkippedNotBetter} skipped (not better)`);
console.log(`  - ${stressSkippedCollisions} skipped (would add collisions)`);
console.log(`  - ${stressSkippedConflicts} skipped (spelling conflict)`);
console.log(`  - ${stressImprovements.length} valid improvements found`);

stressImprovements.sort((a, b) => b.familiarityDelta - a.familiarityDelta);

console.log(`\n${'='.repeat(80)}`);
console.log(`STRESS-CONDITIONED IMPROVEMENTS (by familiarity delta)`);
console.log(`${'='.repeat(80)}\n`);

if (stressImprovements.length === 0) {
  console.log('No stress-conditioned improvements found.');
} else {
  console.log('Raw Ph. | Current | Better  | Delta /M    | New Familiarity %');
  console.log('─'.repeat(65));
  for (const imp of stressImprovements.slice(0, 20)) {
    console.log(
      `  ${imp.key.padEnd(5)} | ${imp.from.padEnd(7)} | ${imp.to.padEnd(7)} | ${signedPM(imp.familiarityDelta).padEnd(11)} | ${imp.newFamiliarityPct.toFixed(2)}%`
    );
  }
}

// ============================================================
// PHASE 3: Greedy combination
// ============================================================

console.log(`\n${'='.repeat(60)}`);
console.log(`TESTING COMBINATIONS`);
console.log(`${'='.repeat(60)}\n`);

const allImprovements = [...improvements, ...stressImprovements];
allImprovements.sort((a, b) => b.familiarityDelta - a.familiarityDelta);

let bestMap = { ...ARPABET_TO_INGGLISH_MAP };
let bestStressOverrides = { ...baselineStressOverrides };
const appliedChanges: Improvement[] = [];
const basePhonemesSeen = new Set<string>();
const stressPhonemesSeen = new Set<string>();

for (const imp of allImprovements) {
  if (imp.type === 'base') {
    if (basePhonemesSeen.has(imp.key)) {
      continue;
    }

    // Check spelling conflict with current best maps
    if (hasSpellingConflict(imp.key, imp.to, bestMap, bestStressOverrides)) {
      console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (spelling conflict)`);
      continue;
    }

    const testMap = { ...bestMap, [imp.key]: imp.to };
    const collisions = getCollisionCount(testMap, bestStressOverrides);

    if (collisions <= baselineCollisions) {
      bestMap[imp.key] = imp.to;
      appliedChanges.push(imp);
      basePhonemesSeen.add(imp.key);
      console.log(
        `✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (Δ ${signedPM(imp.familiarityDelta)} /M)`
      );
    } else {
      console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (would add collisions)`);
    }
  } else {
    if (stressPhonemesSeen.has(imp.key)) {
      continue;
    }

    if (hasSpellingConflict(imp.key, imp.to, bestMap, bestStressOverrides)) {
      console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (spelling conflict) [stress]`);
      continue;
    }

    const testOverrides = { ...bestStressOverrides, [imp.key]: imp.to };
    const collisions = getCollisionCount(bestMap, testOverrides);

    if (collisions <= baselineCollisions) {
      bestStressOverrides[imp.key] = imp.to;
      appliedChanges.push(imp);
      stressPhonemesSeen.add(imp.key);
      console.log(
        `✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (Δ ${signedPM(imp.familiarityDelta)} /M) [stress]`
      );
    } else {
      console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (would add collisions) [stress]`);
    }
  }
}

const finalFamiliarity = computeFamiliarity(bestMap, bestStressOverrides, R_COLORED_FORWARD);
const finalCollisions = getCollisionCount(bestMap, bestStressOverrides);

console.log(`\n${'='.repeat(60)}`);
console.log(`FINAL RESULT`);
console.log(`${'='.repeat(60)}`);
console.log(`\nBefore: ${baselineFamiliarity.pct.toFixed(2)}% spelling familiarity`);
console.log(`After:  ${finalFamiliarity.pct.toFixed(2)}% spelling familiarity`);
console.log(`Change: ${(finalFamiliarity.pct - baselineFamiliarity.pct).toFixed(2)} pp`);
console.log(`\nCollisions: ${finalCollisions} (was ${baselineCollisions})`);

console.log(`\n${'='.repeat(80)}`);
console.log(`RECOMMENDED CHANGES (sorted by familiarity impact)`);
console.log(`${'='.repeat(80)}\n`);

// Show sample words for each change
for (const imp of appliedChanges) {
  const label = imp.type === 'stress' ? ' [stress-conditioned]' : '';
  console.log(
    `  ${imp.key}: "${imp.from}" → "${imp.to}" (Δ ${signedPM(imp.familiarityDelta)} /M)${label}`
  );

  // Show top affected words
  const affected =
    imp.type === 'base'
      ? (wordsWithPhoneme.get(imp.key) ?? [])
      : (wordsWithRawPhoneme.get(imp.key) ?? []);
  const topWords = affected
    .map((w) => ({ word: w, freq: getWordFrequency(w) ?? 0 }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 5);
  const testMap =
    imp.type === 'base'
      ? { ...ARPABET_TO_INGGLISH_MAP, [imp.key]: imp.to }
      : ARPABET_TO_INGGLISH_MAP;
  const testOverrides =
    imp.type === 'stress'
      ? { ...baselineStressOverrides, [imp.key]: imp.to }
      : baselineStressOverrides;
  const examples = topWords.map((w) => {
    const raw = wordRawPhonemes.get(w.word)!;
    const oldSpelling = phonemesToSpelling(raw, ARPABET_TO_INGGLISH_MAP, baselineStressOverrides);
    const newSpelling = phonemesToSpelling(raw, testMap, testOverrides);
    return `${w.word} (${oldSpelling}→${newSpelling})`;
  });
  console.log(`    Examples: ${examples.join(', ')}`);
}
