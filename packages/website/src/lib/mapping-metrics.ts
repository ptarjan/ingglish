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
const NON_ALPHA = /[^a-z]/i;

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

/** Edit similarity: 1 - (editDistance / maxLen). Returns 0–1. */
export function editSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  return maxLen > 0 ? 1 - charEditDistance(a, b) / maxLen : 1;
}

// ============================================================
// 2. G2P round-trip pronounceability
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
// 3. Orthotactic probability (naturalness)
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
