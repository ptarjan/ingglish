/**
 * Metric functions for evaluating phoneme-to-grapheme mappings.
 *
 * These are pure scoring functions extracted from MappingStats for testability.
 * See docs/identical-words-analysis.md for analysis of each metric's strengths
 * and limitations.
 */

import { getDictionary, getWordFrequency } from '@ingglish/dictionary';
import { wordToArpabet } from '@ingglish/g2p';
import { stripStress } from '@ingglish/phonemes';

/** Pre-compiled regex for filtering dictionary entries with punctuation */
export const NON_ALPHA = /[^a-z]/i;

// ============================================================
// Types
// ============================================================

export interface MetricInput {
  english: string;
  frequency: number;
  phonemes: string[];
  spelling: string;
}

export interface WeightedMetrics {
  editSimilarity: number;
  naturalness: number;
  pronounceability: number;
  spellingFamiliarity: number;
  textPreservedPct: number;
}

// ============================================================
// 1. Edit distance (Levenshtein similarity)
// ============================================================

/** Character-level Levenshtein distance. Single-row DP. */
export function charEditDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) {
    return n;
  }
  if (n === 0) {
    return m;
  }

  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);
  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min((prev[j] ?? 0) + 1, (curr[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n] ?? 0;
}

/**
 * Compute frequency-weighted aggregate metrics over a set of word entries.
 * @param phonemeToGrapheme Maps a single phoneme (e.g. "B") to its grapheme string (e.g. "b")
 */
export function computeWeightedMetrics(
  entries: MetricInput[],
  phonemeToGrapheme: (phoneme: string) => string
): WeightedMetrics {
  let totalFreq = 0;
  let identicalFreq = 0;
  let pronounceabilitySum = 0;
  let naturalnessSum = 0;
  let editSimilaritySum = 0;
  let spellingFamiliaritySum = 0;
  const graphemeCache = new Map<string, string>();

  for (const { english, frequency, phonemes, spelling } of entries) {
    const englishLower = english.toLowerCase();
    const spellingLower = spelling.toLowerCase();

    totalFreq += frequency;
    if (englishLower === spellingLower) {
      identicalFreq += frequency;
    }

    if (frequency > 0) {
      pronounceabilitySum += g2pRoundtripScore(spelling, phonemes) * frequency;

      const natScore = scoreWordOrthotactic(spelling);
      if (natScore !== -Infinity) {
        naturalnessSum += natScore * frequency;
      }

      editSimilaritySum += editSimilarity(englishLower, spellingLower) * frequency;

      let hits = 0;
      let total = 0;
      for (const p of phonemes) {
        let g = graphemeCache.get(p);
        if (g === undefined) {
          g = phonemeToGrapheme(p);
          graphemeCache.set(p, g);
        }
        if (englishLower.includes(g)) {
          hits++;
        }
        total++;
      }
      if (total > 0) {
        spellingFamiliaritySum += (hits / total) * frequency;
      }
    }
  }

  return {
    editSimilarity: totalFreq > 0 ? editSimilaritySum / totalFreq : 0,
    naturalness: totalFreq > 0 ? naturalnessSum / totalFreq : -Infinity,
    pronounceability: totalFreq > 0 ? pronounceabilitySum / totalFreq : 0,
    spellingFamiliarity: totalFreq > 0 ? spellingFamiliaritySum / totalFreq : 0,
    textPreservedPct: totalFreq > 0 ? (identicalFreq / totalFreq) * 100 : 0,
  };
}

/** Edit similarity: 1 - (editDistance / maxLen). Returns 0–1. */
export function editSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  return maxLen > 0 ? 1 - charEditDistance(a, b) / maxLen : 1;
}

// ============================================================
// 3. G2P round-trip pronounceability
// ============================================================

/** G2P round-trip score: feed spelling to G2P, compare predicted vs original phonemes. Returns 0–1. */
export function g2pRoundtripScore(spelling: string, originalPhonemes: string[]): number {
  const predicted = wordToArpabet(spelling).map((p) => stripStress(p));
  const original = originalPhonemes.map((p) => stripStress(p));
  const maxLen = Math.max(predicted.length, original.length);
  if (maxLen === 0) {
    return 1;
  }
  return 1 - phonemeLevenshtein(predicted, original) / maxLen;
}

/** Levenshtein distance between two string arrays. Single-row DP. */
export function phonemeLevenshtein(a: string[], b: string[]): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) {
    return n;
  }
  if (n === 0) {
    return m;
  }

  let prev = new Uint16Array(n + 1);
  let curr = new Uint16Array(n + 1);
  for (let j = 0; j <= n; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min((prev[j] ?? 0) + 1, (curr[j - 1] ?? 0) + 1, (prev[j - 1] ?? 0) + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n] ?? 0;
}

// ============================================================
// 4. Orthotactic probability (naturalness)
// ============================================================

const SMOOTHING_K = 0.01;

/** Cached bigram model, built once from dictionary English words */
let bigramModel: null | {
  bigramCounts: Map<string, number>;
  unigramCounts: Map<string, number>;
  vocabSize: number;
} = null;

export function getBigramModel() {
  if (bigramModel !== null) {
    return bigramModel;
  }

  const dict = getDictionary();
  const bigramCounts = new Map<string, number>();
  const unigramCounts = new Map<string, number>();
  const alphabet = new Set<string>();

  for (const word of Object.keys(dict)) {
    const w = word.toLowerCase();
    if (NON_ALPHA.test(w)) {
      continue;
    }
    const freq = getWordFrequency(w) ?? 0;
    const weight = Math.log(freq + 1);
    const chars = '^' + w + '$';
    for (let i = 0; i < chars.length - 1; i++) {
      const c1 = chars[i]!;
      const c2 = chars[i + 1]!;
      alphabet.add(c1);
      alphabet.add(c2);
      const key = c1 + c2;
      bigramCounts.set(key, (bigramCounts.get(key) ?? 0) + weight);
      unigramCounts.set(c1, (unigramCounts.get(c1) ?? 0) + weight);
    }
  }

  bigramModel = { bigramCounts, unigramCounts, vocabSize: alphabet.size };
  return bigramModel;
}

/** Score a word by average log bigram probability (higher = more English-looking) */
export function scoreWordOrthotactic(word: string): number {
  const { bigramCounts, unigramCounts, vocabSize } = getBigramModel();
  const w = word.toLowerCase();
  const chars = '^' + w + '$';
  const n = chars.length - 1;
  if (n === 0) {
    return -Infinity;
  }

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const count = bigramCounts.get(chars[i]! + chars[i + 1]!) ?? 0;
    const total = unigramCounts.get(chars[i]!) ?? 0;
    sum += Math.log((count + SMOOTHING_K) / (total + SMOOTHING_K * vocabSize));
  }
  return sum / n;
}
