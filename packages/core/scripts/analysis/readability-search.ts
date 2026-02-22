#!/usr/bin/env npx vite-node
/**
 * Readability metric analysis: frequency-weighted normalized edit-distance similarity.
 *
 * Unlike exhaustive-search.ts which uses binary identical/not-identical,
 * this captures partial improvements — "bot" for "boat" is closer than "boht".
 *
 * Metric: similarity(word) = 1 - (levenshtein(english, ingglish) / max(len(english), len(ingglish)))
 *         readability = Σ(similarity × frequency) / Σ(frequency)
 */

import {
  loadDictionary,
  getDictionary,
  loadFrequencies,
  getWordFrequency,
} from '@ingglish/dictionary';
import { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from '@ingglish/phonemes';

const [, freqData] = await Promise.all([loadDictionary(), loadFrequencies()]);
const cmudict = getDictionary();
const allWords = Object.keys(cmudict).filter((w) => cmudict[w]?.length > 0);
const corpusTotal = Object.values(freqData).reduce((sum, v) => sum + v, 0);
const perMillion = (raw: number) => (raw / corpusTotal) * 1_000_000;

function stripStress(phoneme: string): string {
  return phoneme.replace(/[0-2]$/, '');
}

// --- Levenshtein distance ---
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single-row DP
  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

function similarity(english: string, ingglish: string): number {
  const maxLen = Math.max(english.length, ingglish.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(english, ingglish) / maxLen;
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
  let result = '';
  const len = rawPhonemes.length;
  for (let i = 0; i < len; i++) {
    const p = rawPhonemes[i];
    // Stress overrides first (e.g. AH0 → 'a')
    if (stressOverrides && p in stressOverrides) {
      // But R-colored override takes precedence: AH0+R → 'ur' not 'ar'
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
    // R-colored vowel check
    if (i + 1 < len && rawPhonemes[i + 1] === 'R') {
      const rPrefix = R_COLORED_FORWARD.get(base);
      if (rPrefix !== undefined) {
        result += rPrefix;
        continue;
      }
    }
    result += map[base] || base.toLowerCase();
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

// Pre-compute which words contain each base phoneme
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

// --- Readability score computation ---

/** Compute frequency-weighted readability for a set of words */
function computeReadability(
  map: Record<string, string>,
  stressOverrides?: Record<string, string>
): number {
  let weightedSim = 0;
  let totalFreq = 0;
  for (const word of allWords) {
    const rawPhonemes = wordRawPhonemes.get(word);
    if (!rawPhonemes) continue;
    const spelling = phonemesToSpelling(rawPhonemes, map, stressOverrides);
    const freq = getWordFrequency(word) ?? 0;
    if (freq === 0) continue; // Skip words not in frequency corpus
    const sim = similarity(word.toLowerCase(), spelling.toLowerCase());
    weightedSim += sim * freq;
    totalFreq += freq;
  }
  return weightedSim / totalFreq;
}

// Pre-compute baseline similarity for each word
const baselineSimilarities = new Map<string, number>();
for (const word of allWords) {
  const rawPhonemes = wordRawPhonemes.get(word);
  if (!rawPhonemes) continue;
  const spelling = phonemesToSpelling(
    rawPhonemes,
    ARPABET_TO_INGGLISH_MAP,
    baselineStressOverrides
  );
  baselineSimilarities.set(word, similarity(word.toLowerCase(), spelling.toLowerCase()));
}

// Compute baseline readability
const baselineReadability = computeReadability(ARPABET_TO_INGGLISH_MAP, baselineStressOverrides);
const baselineCollisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP, baselineStressOverrides);

console.log(`Baseline readability: ${(baselineReadability * 100).toFixed(3)}%`);
console.log(`Baseline collisions:  ${baselineCollisions}`);
console.log(
  `Frequency unit: per million words of text (SUBTLEX-US, ${(corpusTotal / 1_000_000).toFixed(1)}M word corpus)\n`
);

// --- Incremental readability delta ---

type ReadabilityDelta = {
  delta: number; // change in weighted similarity score
  freqWeightedDelta: number; // delta expressed as per-million impact
  topImproved: { word: string; from: number; to: number; freq: number }[];
  topWorsened: { word: string; from: number; to: number; freq: number }[];
};

function getReadabilityDelta(
  affectedWords: string[],
  map: Record<string, string>,
  stressOverrides?: Record<string, string>
): ReadabilityDelta {
  let deltaWeighted = 0;
  const improved: { word: string; from: number; to: number; freq: number }[] = [];
  const worsened: { word: string; from: number; to: number; freq: number }[] = [];

  for (const word of affectedWords) {
    const rawPhonemes = wordRawPhonemes.get(word)!;
    const freq = getWordFrequency(word) ?? 0;
    if (freq === 0) continue;

    const newSpelling = phonemesToSpelling(rawPhonemes, map, stressOverrides);
    const newSim = similarity(word.toLowerCase(), newSpelling.toLowerCase());
    const oldSim = baselineSimilarities.get(word) ?? 0;
    const diff = newSim - oldSim;

    if (Math.abs(diff) > 1e-9) {
      deltaWeighted += diff * freq;
      if (diff > 0) {
        improved.push({ word, from: oldSim, to: newSim, freq });
      } else {
        worsened.push({ word, from: oldSim, to: newSim, freq });
      }
    }
  }

  // Sort by frequency-weighted impact
  improved.sort((a, b) => (b.to - b.from) * b.freq - (a.to - a.from) * a.freq);
  worsened.sort((a, b) => (a.to - a.from) * a.freq - (b.to - b.from) * b.freq);

  return {
    delta: deltaWeighted,
    freqWeightedDelta: perMillion(deltaWeighted),
    topImproved: improved.slice(0, 10),
    topWorsened: worsened.slice(0, 10),
  };
}

// Generate all spelling options
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

/** Format a readability delta for display */
function fmtDelta(delta: number): string {
  const sign = delta >= 0 ? '+' : '';
  if (Math.abs(delta) >= 1000) return `${sign}${(delta / 1000).toFixed(1)}K`;
  if (Math.abs(delta) >= 1) return `${sign}${delta.toFixed(0)}`;
  if (Math.abs(delta) >= 0.1) return `${sign}${delta.toFixed(1)}`;
  if (Math.abs(delta) >= 0.01) return `${sign}${delta.toFixed(2)}`;
  return `${sign}${delta.toFixed(3)}`;
}

/** Format per-million */
function fmtPM(raw: number): string {
  const pm = perMillion(Math.abs(raw));
  if (pm >= 1000) return `${(pm / 1000).toFixed(1)}K`;
  if (pm >= 1) return pm.toFixed(0);
  if (pm >= 0.1) return pm.toFixed(1);
  if (Math.abs(raw) > 0) return '<1';
  return '0';
}

function signedPM(raw: number): string {
  if (raw === 0) return '0';
  return `${raw >= 0 ? '+' : '-'}${fmtPM(raw)}`;
}

// ============================================================
// PHASE 1: Base phoneme search
// ============================================================

const phonemes = Object.keys(ARPABET_TO_INGGLISH_MAP);
const totalTests = phonemes.length * allOptions.length;
console.log(
  `Testing ${phonemes.length} phonemes × ${allOptions.length} options = ${totalTests} combinations...\n`
);

type Improvement = {
  type: 'base' | 'stress';
  key: string;
  from: string;
  to: string;
  readabilityDelta: number; // raw weighted delta
  freqWeightedDelta: number; // per-million
  topImproved: ReadabilityDelta['topImproved'];
  topWorsened: ReadabilityDelta['topWorsened'];
};

const baseImprovements: Improvement[] = [];
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

  const affected = wordsWithPhoneme.get(phoneme) || [];

  for (const option of allOptions) {
    if (option === current) continue;
    tested++;

    const testMap = { ...ARPABET_TO_INGGLISH_MAP, [phoneme]: option };
    const delta = getReadabilityDelta(affected, testMap, baselineStressOverrides);

    if (delta.delta <= 0) {
      skippedNotBetter++;
      continue;
    }

    // Collision check
    const collisions = getCollisionCount(testMap, baselineStressOverrides);
    if (collisions > baselineCollisions) {
      skippedCollisions++;
      continue;
    }

    baseImprovements.push({
      type: 'base',
      key: phoneme,
      from: current,
      to: option,
      readabilityDelta: delta.delta,
      freqWeightedDelta: delta.freqWeightedDelta,
      topImproved: delta.topImproved,
      topWorsened: delta.topWorsened,
    });
  }
}
console.log(); // newline after progress

console.log(`\nTested ${tested} combinations:`);
console.log(`  - ${skippedNotBetter} skipped (not better)`);
console.log(`  - ${skippedCollisions} skipped (would add collisions)`);
console.log(`  - ${baseImprovements.length} valid improvements found`);

baseImprovements.sort((a, b) => b.freqWeightedDelta - a.freqWeightedDelta);

console.log(`\n${'='.repeat(90)}`);
console.log(`ALL SAFE BASE IMPROVEMENTS (readability metric): ${baseImprovements.length}`);
console.log(`${'='.repeat(90)}\n`);

if (baseImprovements.length === 0) {
  console.log('No base improvements possible without creating new collisions.');
} else {
  console.log('Phoneme | Current | Better  | Δ Readability /M');
  console.log('─'.repeat(55));
  for (const imp of baseImprovements) {
    console.log(
      `  ${imp.key.padEnd(5)} | ${imp.from.padEnd(7)} | ${imp.to.padEnd(7)} | ${fmtDelta(imp.freqWeightedDelta).padEnd(10)} /M`
    );
  }

  console.log(`\n${'='.repeat(90)}`);
  console.log(`DETAILS FOR TOP BASE IMPROVEMENTS (by readability)`);
  console.log(`${'='.repeat(90)}`);
  for (const imp of baseImprovements.slice(0, 10)) {
    console.log(
      `\n${imp.key}: "${imp.from}" → "${imp.to}" (${fmtDelta(imp.freqWeightedDelta)} /M readability)`
    );
    if (imp.topImproved.length > 0) {
      console.log(
        `  Top improved: ${imp.topImproved
          .slice(0, 5)
          .map(
            (w) =>
              `${w.word}(${(w.from * 100).toFixed(0)}→${(w.to * 100).toFixed(0)}%, ${fmtPM(w.freq)}/M)`
          )
          .join(', ')}`
      );
    }
    if (imp.topWorsened.length > 0) {
      console.log(
        `  Top worsened: ${imp.topWorsened
          .slice(0, 5)
          .map(
            (w) =>
              `${w.word}(${(w.from * 100).toFixed(0)}→${(w.to * 100).toFixed(0)}%, ${fmtPM(w.freq)}/M)`
          )
          .join(', ')}`
      );
    }
  }
}

// ============================================================
// PHASE 2: Stress-conditioned search
// ============================================================

console.log(`\n${'='.repeat(60)}`);
console.log(`STRESS-CONDITIONED IMPROVEMENTS (readability metric)`);
console.log(`${'='.repeat(60)}\n`);

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

const sortedStress0 = [...stress0Phonemes].sort();
for (let si = 0; si < sortedStress0.length; si++) {
  const rawPhoneme = sortedStress0[si];
  const currentSpelling =
    baselineStressOverrides[rawPhoneme] ?? ARPABET_TO_INGGLISH_MAP[stripStress(rawPhoneme)];
  const progressPct = (((si + 1) / sortedStress0.length) * 100).toFixed(0);
  process.stdout.write(
    `\r[${progressPct}%] Testing ${rawPhoneme.padEnd(4)} (${si + 1}/${sortedStress0.length})...`
  );

  const affected = wordsWithRawPhoneme.get(rawPhoneme) || [];

  for (const option of allOptions) {
    if (option === currentSpelling) continue;
    stressTested++;

    const testOverrides = { ...baselineStressOverrides, [rawPhoneme]: option };
    const delta = getReadabilityDelta(affected, ARPABET_TO_INGGLISH_MAP, testOverrides);

    if (delta.delta <= 0) {
      stressSkippedNotBetter++;
      continue;
    }

    const collisions = getCollisionCount(ARPABET_TO_INGGLISH_MAP, testOverrides);
    if (collisions > baselineCollisions) {
      stressSkippedCollisions++;
      continue;
    }

    stressImprovements.push({
      type: 'stress',
      key: rawPhoneme,
      from: currentSpelling,
      to: option,
      readabilityDelta: delta.delta,
      freqWeightedDelta: delta.freqWeightedDelta,
      topImproved: delta.topImproved,
      topWorsened: delta.topWorsened,
    });
  }
}
console.log(); // newline after progress

console.log(`\nTested ${stressTested} stress-conditioned combinations:`);
console.log(`  - ${stressSkippedNotBetter} skipped (not better)`);
console.log(`  - ${stressSkippedCollisions} skipped (would add collisions)`);
console.log(`  - ${stressImprovements.length} valid improvements found`);

stressImprovements.sort((a, b) => b.freqWeightedDelta - a.freqWeightedDelta);

if (stressImprovements.length === 0) {
  console.log('\nNo stress-conditioned improvements found.');
} else {
  console.log('\nRaw Ph. | Current | Better  | Δ Readability /M');
  console.log('─'.repeat(55));
  for (const imp of stressImprovements) {
    console.log(
      `  ${imp.key.padEnd(5)} | ${imp.from.padEnd(7)} | ${imp.to.padEnd(7)} | ${fmtDelta(imp.freqWeightedDelta).padEnd(10)} /M`
    );
  }

  console.log(`\n${'='.repeat(90)}`);
  console.log(`DETAILS FOR TOP STRESS-CONDITIONED IMPROVEMENTS (by readability)`);
  console.log(`${'='.repeat(90)}`);
  for (const imp of stressImprovements.slice(0, 10)) {
    console.log(
      `\n${imp.key}: "${imp.from}" → "${imp.to}" (${fmtDelta(imp.freqWeightedDelta)} /M readability)`
    );
    if (imp.topImproved.length > 0) {
      console.log(
        `  Top improved: ${imp.topImproved
          .slice(0, 5)
          .map(
            (w) =>
              `${w.word}(${(w.from * 100).toFixed(0)}→${(w.to * 100).toFixed(0)}%, ${fmtPM(w.freq)}/M)`
          )
          .join(', ')}`
      );
    }
    if (imp.topWorsened.length > 0) {
      console.log(
        `  Top worsened: ${imp.topWorsened
          .slice(0, 5)
          .map(
            (w) =>
              `${w.word}(${(w.from * 100).toFixed(0)}→${(w.to * 100).toFixed(0)}%, ${fmtPM(w.freq)}/M)`
          )
          .join(', ')}`
      );
    }
  }
}

// ============================================================
// PHASE 3: Test combinations (base + stress-conditioned)
// ============================================================

console.log(`\n${'='.repeat(60)}`);
console.log(`TESTING COMBINATIONS`);
console.log(`${'='.repeat(60)}\n`);

// Merge all improvements into a unified list sorted by readability delta
const allImprovements: Improvement[] = [...baseImprovements, ...stressImprovements];
allImprovements.sort((a, b) => b.freqWeightedDelta - a.freqWeightedDelta);

let bestMap = { ...ARPABET_TO_INGGLISH_MAP };
let bestStressOverrides = { ...baselineStressOverrides };
const appliedChanges: Improvement[] = [];
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
      console.log(
        `✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (${fmtDelta(imp.freqWeightedDelta)} /M)`
      );
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
      console.log(
        `✓ Applied ${imp.key}: ${imp.from} → ${imp.to} (${fmtDelta(imp.freqWeightedDelta)} /M) [stress]`
      );
    } else {
      console.log(`✗ Skipped ${imp.key}: ${imp.from} → ${imp.to} (would add collisions) [stress]`);
    }
  }
}

const finalReadability = computeReadability(bestMap, bestStressOverrides);
const finalCollisions = getCollisionCount(bestMap, bestStressOverrides);

console.log(`\n${'='.repeat(60)}`);
console.log(`FINAL RESULT`);
console.log(`${'='.repeat(60)}`);
console.log(`\nBefore: ${(baselineReadability * 100).toFixed(3)}% readability`);
console.log(`After:  ${(finalReadability * 100).toFixed(3)}% readability`);
console.log(
  `Gain:   +${((finalReadability - baselineReadability) * 100).toFixed(3)} percentage points`
);
console.log(`\nCollisions: ${finalCollisions} (was ${baselineCollisions})`);

console.log(`\n${'='.repeat(90)}`);
console.log(`RECOMMENDED CHANGES (sorted by readability impact)`);
console.log(`${'='.repeat(90)}\n`);
for (const imp of appliedChanges) {
  const label = imp.type === 'stress' ? ' [stress-conditioned]' : '';
  console.log(
    `  ${imp.key}: "${imp.from}" → "${imp.to}" (${fmtDelta(imp.freqWeightedDelta)} /M readability)${label}`
  );
  if (imp.topImproved.length > 0) {
    console.log(
      `    Top improved: ${imp.topImproved
        .slice(0, 5)
        .map((w) => `${w.word}(${(w.from * 100).toFixed(0)}→${(w.to * 100).toFixed(0)}%)`)
        .join(', ')}`
    );
  }
  if (imp.topWorsened.length > 0) {
    console.log(
      `    Top worsened: ${imp.topWorsened
        .slice(0, 5)
        .map((w) => `${w.word}(${(w.from * 100).toFixed(0)}→${(w.to * 100).toFixed(0)}%)`)
        .join(', ')}`
    );
  }
}
