/**
 * Word frequency scoring using SUBTLEX corpus data.
 * Used for selecting the most common word among homophones.
 */

import { createLazyLoader } from './lazy-loader';
import { loadJson } from './load-json';

interface FrequencyData {
  map: Map<string, number>;
  raw: Record<string, number>;
}

const loader = createLazyLoader<FrequencyData>(async () => {
  const json = await loadJson<Record<string, number>>('data/word-frequencies');
  let raw: Record<string, number>;
  if (json === null) {
    const mod = await import('./data/word-frequencies');
    raw = mod.default;
  } else {
    raw = json;
  }
  const map = new Map<string, number>();
  for (const [word, count] of Object.entries(raw)) {
    map.set(word.toLowerCase(), count);
  }
  return { map, raw };
}, 'word frequencies');

/**
 * Returns the frequency count for a word (higher = more common).
 * Returns undefined if word is not in the corpus or data hasn't loaded yet.
 */
export function getWordFrequency(word: string): number | undefined {
  if (!loader.isLoaded()) {
    return undefined;
  }
  return loader.get().map.get(word.toLowerCase());
}

/**
 * Loads word frequency data.
 * The data is cached after first load.
 */
export async function loadFrequencies(): Promise<Record<string, number>> {
  const data = await loader.load();
  return data.raw;
}

// Common English contractions that should be preferred over homophones
const COMMON_CONTRACTIONS = new Set([
  "ain't",
  "aren't",
  // n't contractions
  "can't",
  "could've",
  "couldn't",
  "didn't",
  "doesn't",
  "don't",
  "hadn't",
  "hasn't",
  "haven't",
  "he'd",
  "he'll",
  // 's contractions (is/has)
  "he's",
  "here's",
  "how's",
  // 'd contractions
  "i'd",
  // 'll contractions
  "i'll",
  // 'm contractions
  "i'm",
  // 've contractions
  "i've",
  "isn't",
  "it'd",
  "it'll",
  "it's",
  "let's",
  "might've",
  "mightn't",
  "must've",
  "mustn't",
  "needn't",
  "shan't",
  "she'd",
  "she'll",
  "she's",
  "should've",
  "shouldn't",
  "that'd",
  "that'll",
  "that's",
  "there'll",
  "there's",
  "they'd",
  "they'll",
  "they're",
  "they've",
  "wasn't",
  "we'd",
  "we'll",
  "we're",
  "we've",
  "weren't",
  "what'll",
  "what's",
  "where's",
  "who'd",
  "who'll",
  "who's",
  "won't",
  "would've",
  "wouldn't",
  "you'd",
  "you'll",
  // 're contractions
  "you're",
  "you've",
]);

// Scoring constants for word ranking (lower = more likely)
const CONTRACTION_FREQUENCY_BOOST = 10_000_000; // Added to frequency for known contractions
const UNKNOWN_CONTRACTION_SCORE = -5_000_000; // Score for contractions without frequency data
const NUMERIC_WORD_PENALTY = 1_000_000; // Penalty for words containing numbers
const UNKNOWN_WORD_PENALTY = 100_000; // Base penalty for unknown words

// Pre-compiled regex for hot path performance
const NUMERIC_REGEX = /\d/;

/**
 * Scores a word for ranking - lower score is better (more common).
 * Used for sorting homophones by likelihood.
 */
export function scoreWord(word: string): number {
  const lower = word.toLowerCase();
  const frequency = loader.isLoaded() ? loader.get().map.get(lower) : undefined;

  // Boost common contractions - they're usually more common than their
  // homophones (e.g., "won't" vs archaic "wont")
  const isCommonContraction = COMMON_CONTRACTIONS.has(lower);

  if (frequency !== undefined) {
    // Common contractions get a boost since SUBTLEX often underrepresents them
    return isCommonContraction ? -frequency - CONTRACTION_FREQUENCY_BOOST : -frequency;
  }

  // Common contractions without frequency data are still boosted
  if (isCommonContraction) {
    return UNKNOWN_CONTRACTION_SCORE;
  }

  // Penalize words with numbers (likely variant spellings like HELLO2)
  if (NUMERIC_REGEX.test(word)) {
    return NUMERIC_WORD_PENALTY + word.length;
  }

  // Unknown words: penalize by length (shorter usually more common)
  return UNKNOWN_WORD_PENALTY + word.length;
}

/**
 * Sorts words by frequency (most common first).
 */
export function sortByFrequency(words: string[]): string[] {
  return words.toSorted((a, b) => scoreWord(a) - scoreWord(b));
}
