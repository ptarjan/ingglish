#!/usr/bin/env npx vite-node
/**
 * G2P round-trip pronounceability hill climb.
 *
 * Evaluates phoneme→grapheme mappings by feeding the resulting Ingglish
 * spellings back through the G2P model and comparing predicted phonemes
 * against the original CMU phonemes. This directly measures "would an
 * English reader pronounce this correctly?"
 *
 * Metric: frequency-weighted phoneme recovery rate (0.0–1.0).
 */

import {
  getDictionary,
  getWordFrequency,
  getCorpusTotal,
  loadDictionary,
  loadFrequencies,
} from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD, stripStress } from '@ingglish/phonemes';

await Promise.all([loadDictionary(), loadFrequencies()]);
const cmudict = getDictionary();
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0);
const corpusTotal = getCorpusTotal();
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
// Levenshtein distance on string arrays (phoneme sequences)
// ============================================================

/** Levenshtein distance between two string arrays. Single-row DP. */
function levenshtein(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // prev[j] = distance between a[0..i-1] and b[0..j]
  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1]! + 1, prev[j - 1]! + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n]!;
}

// ============================================================
// G2P round-trip scoring
// ============================================================

/** Score a single word: 1 - levenshtein(predicted, original) / max(len) */
function scoreWordG2P(ingglishSpelling: string, originalPhonemes: string[]): number {
  const predicted = wordToArpabet(ingglishSpelling).map((p) => stripStress(p));
  const original = originalPhonemes.map((p) => stripStress(p));
  const maxLen = Math.max(predicted.length, original.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(predicted, original) / maxLen;
}

// ============================================================
// Spelling functions (same as exhaustive-search.ts)
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

// ============================================================
// G2P round-trip pronounceability scoring
// ============================================================

/** Pre-compute baseline spellings and per-word G2P scores */
const baselineSpellings = new Map<string, string>();
const baselineWordScores = new Map<string, number>();
for (const word of allWords) {
  const rawPhonemes = wordRawPhonemes.get(word);
  if (!rawPhonemes) continue;
  const spelling = phonemesToSpelling(
    rawPhonemes,
    ARPABET_TO_INGGLISH_MAP,
    baselineStressOverrides
  );
  baselineSpellings.set(word, spelling);
  baselineWordScores.set(word, scoreWordG2P(spelling, rawPhonemes));
}

/** Compute aggregate pronounceability: frequency-weighted average score */
function computeAggregateScore(wordScores: Map<string, number>): number {
  let scoreSum = 0;
  let freqSum = 0;
  for (const word of allWords) {
    const score = wordScores.get(word);
    if (score === undefined) continue;
    const freq = getWordFrequency(word) ?? 0;
    if (freq === 0) continue;
    scoreSum += score * freq;
    freqSum += freq;
  }
  return freqSum > 0 ? scoreSum / freqSum : 0;
}

const baselineAggregate = computeAggregateScore(baselineWordScores);

/**
 * Compute pronounceability delta for a base phoneme change.
 * Only re-scores words affected by the phoneme change.
 */
function getG2PDelta(phoneme: string, newValue: string): { delta: number; newAggregate: number } {
  const affected = wordsWithPhoneme.get(phoneme) ?? [];
  const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: newValue };
  let oldWeightedSum = 0;
  let newWeightedSum = 0;
  let affectedFreqSum = 0;

  for (const word of affected) {
    const rawPhonemes = wordRawPhonemes.get(word)!;
    const freq = getWordFrequency(word) ?? 0;
    if (freq === 0) continue;

    const oldScore = baselineWordScores.get(word);
    if (oldScore === undefined) continue;

    const newSpelling = phonemesToSpelling(rawPhonemes, testMap, baselineStressOverrides);
    const newScore = scoreWordG2P(newSpelling, rawPhonemes);

    oldWeightedSum += oldScore * freq;
    newWeightedSum += newScore * freq;
    affectedFreqSum += freq;
  }

  const delta = affectedFreqSum > 0 ? (newWeightedSum - oldWeightedSum) / affectedFreqSum : 0;

  // Approximate new aggregate: adjust baseline by the weighted delta
  let totalFreqSum = 0;
  for (const word of allWords) {
    const freq = getWordFrequency(word) ?? 0;
    if (freq > 0 && baselineWordScores.get(word) !== undefined) totalFreqSum += freq;
  }
  const newAggregate =
    totalFreqSum > 0
      ? baselineAggregate + (newWeightedSum - oldWeightedSum) / totalFreqSum
      : baselineAggregate;

  return { delta, newAggregate };
}

/**
 * Compute pronounceability delta for a stress-conditioned change.
 */
function getStressG2PDelta(
  rawPhoneme: string,
  newValue: string
): { delta: number; newAggregate: number } {
  const affected = wordsWithRawPhoneme.get(rawPhoneme) ?? [];
  const testOverrides = { ...baselineStressOverrides, [rawPhoneme]: newValue };
  let oldWeightedSum = 0;
  let newWeightedSum = 0;
  let affectedFreqSum = 0;

  for (const word of affected) {
    const rawPhonemes = wordRawPhonemes.get(word)!;
    const freq = getWordFrequency(word) ?? 0;
    if (freq === 0) continue;

    const oldScore = baselineWordScores.get(word);
    if (oldScore === undefined) continue;

    const newSpelling = phonemesToSpelling(rawPhonemes, ARPABET_TO_INGGLISH_MAP, testOverrides);
    const newScore = scoreWordG2P(newSpelling, rawPhonemes);

    oldWeightedSum += oldScore * freq;
    newWeightedSum += newScore * freq;
    affectedFreqSum += freq;
  }

  const delta = affectedFreqSum > 0 ? (newWeightedSum - oldWeightedSum) / affectedFreqSum : 0;

  let totalFreqSum = 0;
  for (const word of allWords) {
    const freq = getWordFrequency(word) ?? 0;
    if (freq > 0 && baselineWordScores.get(word) !== undefined) totalFreqSum += freq;
  }
  const newAggregate =
    totalFreqSum > 0
      ? baselineAggregate + (newWeightedSum - oldWeightedSum) / totalFreqSum
      : baselineAggregate;

  return { delta, newAggregate };
}

/**
 * Check if a spelling would conflict with another phoneme's mapping.
 */
function hasSpellingConflict(
  phoneme: string,
  newSpelling: string,
  map: Record<string, string>,
  stressOverrides: Record<string, string>
): boolean {
  for (const [p, spelling] of Object.entries(map)) {
    if (p !== phoneme && spelling === newSpelling) return true;
  }
  for (const [p, spelling] of Object.entries(stressOverrides)) {
    if (p !== phoneme && spelling === newSpelling) return true;
  }
  return false;
}

const baselineCollisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP, baselineStressOverrides);

console.log(`Baseline pronounceability: ${(baselineAggregate * 100).toFixed(2)}%`);
console.log(`Baseline collisions: ${baselineCollisions}`);
console.log(
  `Frequency unit: per million words of text (SUBTLEX-US, ${(corpusTotal / 1_000_000).toFixed(1)}M word corpus)\n`
);

// Show sample high/low scoring words for sanity check
const wordsByScore = allWords
  .filter((w) => (getWordFrequency(w) ?? 0) > 100)
  .map((w) => ({ word: w, spelling: baselineSpellings.get(w)!, score: baselineWordScores.get(w)! }))
  .filter((w) => w.score !== undefined)
  .sort((a, b) => b.score - a.score);

console.log('Sample high-scoring respellings (best G2P round-trip):');
for (const { word, spelling, score } of wordsByScore.slice(0, 10)) {
  console.log(`  ${word.padEnd(15)} → ${spelling.padEnd(15)} (${(score * 100).toFixed(1)}%)`);
}
console.log('\nSample low-scoring respellings (worst G2P round-trip):');
for (const { word, spelling, score } of wordsByScore.slice(-10)) {
  console.log(`  ${word.padEnd(15)} → ${spelling.padEnd(15)} (${(score * 100).toFixed(1)}%)`);
}

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
  if (pm >= 1000) return `${(pm / 1000).toFixed(1)}K`;
  if (pm >= 1) return pm.toFixed(0);
  if (pm >= 0.1) return pm.toFixed(1);
  if (Math.abs(raw) > 0) return '<1';
  return '0';
}

// ============================================================
// PHASE 1: Base phoneme search
// ============================================================

const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const phonemeLimit = limitArg ? parseInt(limitArg.split('=')[1]!) : Infinity;

const phonemes = Object.keys(ARPABET_TO_INGGLISH_MAP).slice(0, phonemeLimit);
const totalTests = phonemes.length * allOptions.length;
console.log(`\n${'='.repeat(90)}\nPHASE 1: BASE PHONEME SEARCH\n${'='.repeat(90)}`);
console.log(
  `Testing ${phonemes.length} phonemes × ${allOptions.length} options = ${totalTests} combinations...\n`
);

type Improvement = {
  type: 'base' | 'stress';
  key: string;
  from: string;
  to: string;
  delta: number;
  newAggregate: number;
};

const improvements: Improvement[] = [];
let tested = 0;
let skippedNotBetter = 0;
let skippedCollisions = 0;
let skippedConflicts = 0;

for (let pi = 0; pi < phonemes.length; pi++) {
  const phoneme = phonemes[pi]!;
  const current = ARPABET_TO_INGGLISH_MAP[phoneme]!;
  const progressPct = (((pi + 1) / phonemes.length) * 100).toFixed(0);
  process.stdout.write(
    `\r[${progressPct}%] Testing ${phoneme.padEnd(3)} (${pi + 1}/${phonemes.length})...`
  );

  for (const option of allOptions) {
    if (option === current) continue;
    tested++;

    // Check phoneme uniqueness
    if (hasSpellingConflict(phoneme, option, ARPABET_TO_INGGLISH_MAP, baselineStressOverrides)) {
      skippedConflicts++;
      continue;
    }

    // Fast incremental G2P check
    const { delta, newAggregate } = getG2PDelta(phoneme, option);

    if (delta <= 0) {
      skippedNotBetter++;
      continue;
    }

    // Only compute expensive collision check if G2P improved
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
      delta,
      newAggregate,
    });
  }
}
console.log(); // newline after progress

console.log(`\nTested ${tested} combinations:`);
console.log(`  - ${skippedNotBetter} skipped (not better)`);
console.log(`  - ${skippedCollisions} skipped (would add collisions)`);
console.log(`  - ${skippedConflicts} skipped (spelling conflict)`);
console.log(`  - ${improvements.length} valid improvements found`);

improvements.sort((a, b) => b.delta - a.delta);

console.log(`\nPhoneme | Current | Better  | Δ Score      | New Aggregate`);
console.log('─'.repeat(70));
for (const { key, from, to, delta, newAggregate } of improvements.slice(0, 20)) {
  console.log(
    `  ${key.padEnd(5)} | ${from.padEnd(7)} | ${to.padEnd(7)} | ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(3).padEnd(12)}% | ${(newAggregate * 100).toFixed(2)}%`
  );
}

// Show sample words for top improvements
if (improvements.length > 0) {
  console.log(`\nDETAILS FOR TOP BASE IMPROVEMENTS:`);
  for (const { key, from, to, delta } of improvements.slice(0, 5)) {
    const affected = wordsWithPhoneme.get(key) ?? [];
    const testMap = { ...ARPABET_TO_INGGLISH_MAP, [key]: to };

    // Find words with biggest score improvement
    const wordDeltas = affected
      .map((word) => {
        const rawPhonemes = wordRawPhonemes.get(word)!;
        const freq = getWordFrequency(word) ?? 0;
        const oldSpelling = baselineSpellings.get(word)!;
        const newSpelling = phonemesToSpelling(rawPhonemes, testMap, baselineStressOverrides);
        const oldScore = baselineWordScores.get(word) ?? 0;
        const newScore = scoreWordG2P(newSpelling, rawPhonemes);
        return {
          word,
          oldSpelling,
          newSpelling,
          oldScore,
          newScore,
          freq,
          scoreDelta: newScore - oldScore,
        };
      })
      .filter((w) => w.freq > 0)
      .sort((a, b) => b.freq - a.freq);

    console.log(
      `\n  ${key}: "${from}" → "${to}" (Δ ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(3)}%)`
    );
    console.log(`  Top words by frequency:`);
    for (const w of wordDeltas.slice(0, 8)) {
      const sign = w.scoreDelta >= 0 ? '+' : '';
      console.log(
        `    ${w.word.padEnd(12)} ${w.oldSpelling.padEnd(12)} → ${w.newSpelling.padEnd(12)} (${sign}${(w.scoreDelta * 100).toFixed(1)}%, ${fmtPM(w.freq)} /M)`
      );
    }
  }
}

// ============================================================
// PHASE 2: Stress-conditioned search
// ============================================================

console.log(`\n${'='.repeat(90)}`);
console.log(`PHASE 2: STRESS-CONDITIONED SEARCH`);
console.log(`${'='.repeat(90)}\n`);

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

const stressImprovements: Improvement[] = [];
let stressTested = 0;
let stressSkippedNotBetter = 0;
let stressSkippedCollisions = 0;
let stressSkippedConflicts = 0;

const sortedStress0 = [...stress0Phonemes].sort().slice(0, phonemeLimit);
for (let si = 0; si < sortedStress0.length; si++) {
  const rawPhoneme = sortedStress0[si]!;
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

    if (hasSpellingConflict(rawPhoneme, option, ARPABET_TO_INGGLISH_MAP, baselineStressOverrides)) {
      stressSkippedConflicts++;
      continue;
    }

    const { delta, newAggregate } = getStressG2PDelta(rawPhoneme, option);

    if (delta <= 0) {
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
      type: 'stress',
      key: rawPhoneme,
      from: currentSpelling!,
      to: option,
      delta,
      newAggregate,
    });
  }
}
console.log(); // newline after progress

console.log(`\nTested ${stressTested} stress-conditioned combinations:`);
console.log(`  - ${stressSkippedNotBetter} skipped (not better)`);
console.log(`  - ${stressSkippedCollisions} skipped (would add collisions)`);
console.log(`  - ${stressSkippedConflicts} skipped (spelling conflict)`);
console.log(`  - ${stressImprovements.length} valid improvements found`);

stressImprovements.sort((a, b) => b.delta - a.delta);

if (stressImprovements.length > 0) {
  console.log(`\nRaw Ph. | Current | Better  | Δ Score      | New Aggregate`);
  console.log('─'.repeat(70));
  for (const { key, from, to, delta, newAggregate } of stressImprovements.slice(0, 20)) {
    console.log(
      `  ${key.padEnd(5)} | ${from.padEnd(7)} | ${to.padEnd(7)} | ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(3).padEnd(12)}% | ${(newAggregate * 100).toFixed(2)}%`
    );
  }

  console.log(`\nDETAILS FOR TOP STRESS-CONDITIONED IMPROVEMENTS:`);
  for (const { key, from, to, delta } of stressImprovements.slice(0, 5)) {
    const affected = wordsWithRawPhoneme.get(key) ?? [];
    const testOverrides = { ...baselineStressOverrides, [key]: to };

    const wordDeltas = affected
      .map((word) => {
        const rawPhonemes = wordRawPhonemes.get(word)!;
        const freq = getWordFrequency(word) ?? 0;
        const oldSpelling = baselineSpellings.get(word)!;
        const newSpelling = phonemesToSpelling(rawPhonemes, ARPABET_TO_INGGLISH_MAP, testOverrides);
        const oldScore = baselineWordScores.get(word) ?? 0;
        const newScore = scoreWordG2P(newSpelling, rawPhonemes);
        return {
          word,
          oldSpelling,
          newSpelling,
          oldScore,
          newScore,
          freq,
          scoreDelta: newScore - oldScore,
        };
      })
      .filter((w) => w.freq > 0)
      .sort((a, b) => b.freq - a.freq);

    console.log(
      `\n  ${key}: "${from}" → "${to}" (Δ ${delta > 0 ? '+' : ''}${(delta * 100).toFixed(3)}%)`
    );
    console.log(`  Top words by frequency:`);
    for (const w of wordDeltas.slice(0, 8)) {
      const sign = w.scoreDelta >= 0 ? '+' : '';
      console.log(
        `    ${w.word.padEnd(12)} ${w.oldSpelling.padEnd(12)} → ${w.newSpelling.padEnd(12)} (${sign}${(w.scoreDelta * 100).toFixed(1)}%, ${fmtPM(w.freq)} /M)`
      );
    }
  }
}

// ============================================================
// PHASE 3: Greedy combination
// ============================================================

console.log(`\n${'='.repeat(90)}`);
console.log(`PHASE 3: GREEDY COMBINATION`);
console.log(`${'='.repeat(90)}\n`);

const allImprovements = [...improvements, ...stressImprovements];
allImprovements.sort((a, b) => b.delta - a.delta);

let bestMap = { ...ARPABET_TO_INGGLISH_MAP };
let bestStressOverrides = { ...baselineStressOverrides };
const appliedChanges: Improvement[] = [];
const basePhonemesSeen = new Set<string>();
const stressPhonemesSeen = new Set<string>();

for (const imp of allImprovements) {
  if (imp.type === 'base') {
    if (basePhonemesSeen.has(imp.key)) continue;

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
        `✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (Δ +${(imp.delta * 100).toFixed(3)}%)`
      );
    } else {
      console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (would add collisions)`);
    }
  } else {
    if (stressPhonemesSeen.has(imp.key)) continue;

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
        `✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (Δ +${(imp.delta * 100).toFixed(3)}%) [stress]`
      );
    } else {
      console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (would add collisions) [stress]`);
    }
  }
}

// Compute final aggregate score
const finalWordScores = new Map<string, number>();
for (const word of allWords) {
  const rawPhonemes = wordRawPhonemes.get(word);
  if (!rawPhonemes) continue;
  const spelling = phonemesToSpelling(rawPhonemes, bestMap, bestStressOverrides);
  finalWordScores.set(word, scoreWordG2P(spelling, rawPhonemes));
}
const finalAggregate = computeAggregateScore(finalWordScores);
const finalCollisions = getCollisionCount(bestMap, bestStressOverrides);

console.log(`\n${'='.repeat(90)}`);
console.log(`FINAL RESULT`);
console.log(`${'='.repeat(90)}`);
console.log(`\nBefore: ${(baselineAggregate * 100).toFixed(2)}% pronounceability`);
console.log(`After:  ${(finalAggregate * 100).toFixed(2)}% pronounceability`);
console.log(
  `Change: ${finalAggregate - baselineAggregate > 0 ? '+' : ''}${((finalAggregate - baselineAggregate) * 100).toFixed(2)}%`
);
console.log(`\nCollisions: ${finalCollisions} (was ${baselineCollisions})`);

console.log(`\n${'='.repeat(90)}`);
console.log(`RECOMMENDED CHANGES (sorted by pronounceability impact)`);
console.log(`${'='.repeat(90)}\n`);

for (const imp of appliedChanges) {
  const label = imp.type === 'stress' ? ' [stress-conditioned]' : '';
  console.log(
    `  ${imp.key}: "${imp.from}" → "${imp.to}" (Δ +${(imp.delta * 100).toFixed(3)}%)${label}`
  );

  // Show top affected words
  const affected =
    imp.type === 'base'
      ? (wordsWithPhoneme.get(imp.key) ?? [])
      : (wordsWithRawPhoneme.get(imp.key) ?? []);
  const testMap =
    imp.type === 'base'
      ? { ...ARPABET_TO_INGGLISH_MAP, [imp.key]: imp.to }
      : ARPABET_TO_INGGLISH_MAP;
  const testOverrides =
    imp.type === 'stress'
      ? { ...baselineStressOverrides, [imp.key]: imp.to }
      : baselineStressOverrides;
  const examples = affected
    .map((w) => ({ word: w, freq: getWordFrequency(w) ?? 0 }))
    .sort((a, b) => b.freq - a.freq)
    .slice(0, 5)
    .map((w) => {
      const raw = wordRawPhonemes.get(w.word)!;
      const oldSpelling = phonemesToSpelling(raw, ARPABET_TO_INGGLISH_MAP, baselineStressOverrides);
      const newSpelling = phonemesToSpelling(raw, testMap, testOverrides);
      return `${w.word} (${oldSpelling}→${newSpelling}, ${fmtPM(w.freq)} /M)`;
    });
  console.log(`    Examples: ${examples.join(', ')}`);
}
