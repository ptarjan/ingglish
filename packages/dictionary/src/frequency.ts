/**
 * Word frequency scoring using SUBTLEX corpus data.
 * Used for selecting the most common word among homophones.
 */

// Lazy-loaded frequency data and map
let wordFrequencies: Record<string, number> | null = null;
let frequenciesPromise: Promise<Record<string, number>> | null = null;
let frequencyMap: Map<string, number> | null = null;

async function loadFrequencyData(): Promise<Record<string, number>> {
  const module = await import('./data/word-frequencies');
  return module.default;
}

/**
 * Loads word frequency data.
 * The data is cached after first load.
 */
export async function loadFrequencies(): Promise<Record<string, number>> {
  if (wordFrequencies) {
    return wordFrequencies;
  }

  if (frequenciesPromise) {
    return frequenciesPromise;
  }

  frequenciesPromise = loadFrequencyData()
    .then((data) => {
      wordFrequencies = data;
      // Build frequency map eagerly (avoids latency spike on first getWordFrequency call)
      frequencyMap = new Map<string, number>();
      for (const [word, count] of Object.entries(data)) {
        frequencyMap.set(word.toLowerCase(), count);
      }
      return wordFrequencies;
    })
    .catch((error: unknown) => {
      frequenciesPromise = null; // Reset so retry is possible
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load word frequencies: ${message}`);
    });

  return frequenciesPromise;
}

/**
 * Gets the frequency map, building it lazily from loaded data.
 */
function getFrequencyMap(): Map<string, number> | null {
  if (frequencyMap) {
    return frequencyMap;
  }
  if (!wordFrequencies) {
    return null;
  }

  frequencyMap = new Map<string, number>();
  for (const [word, count] of Object.entries(wordFrequencies)) {
    frequencyMap.set(word.toLowerCase(), count);
  }
  return frequencyMap;
}

/**
 * Returns the frequency count for a word (higher = more common).
 * Returns undefined if word is not in the corpus or data hasn't loaded yet.
 */
export function getWordFrequency(word: string): number | undefined {
  const map = getFrequencyMap();
  return map?.get(word.toLowerCase());
}

// Common English contractions that should be preferred over homophones
const COMMON_CONTRACTIONS = new Set([
  // n't contractions
  "can't",
  "won't",
  "don't",
  "didn't",
  "doesn't",
  "isn't",
  "aren't",
  "wasn't",
  "weren't",
  "hasn't",
  "haven't",
  "hadn't",
  "couldn't",
  "wouldn't",
  "shouldn't",
  "mustn't",
  "needn't",
  "mightn't",
  "shan't",
  "ain't",
  // 'll contractions
  "i'll",
  "you'll",
  "he'll",
  "she'll",
  "it'll",
  "we'll",
  "they'll",
  "that'll",
  "who'll",
  "what'll",
  "there'll",
  // 're contractions
  "you're",
  "we're",
  "they're",
  // 've contractions
  "i've",
  "you've",
  "we've",
  "they've",
  "could've",
  "would've",
  "should've",
  "might've",
  "must've",
  // 'd contractions
  "i'd",
  "you'd",
  "he'd",
  "she'd",
  "it'd",
  "we'd",
  "they'd",
  "that'd",
  "who'd",
  // 's contractions (is/has)
  "he's",
  "she's",
  "it's",
  "that's",
  "what's",
  "who's",
  "where's",
  "there's",
  "here's",
  "how's",
  "let's",
  // 'm contractions
  "i'm",
]);

// Scoring constants for word ranking (lower = more likely)
const CONTRACTION_FREQUENCY_BOOST = 10_000_000; // Added to frequency for known contractions
const UNKNOWN_CONTRACTION_SCORE = -5_000_000; // Score for contractions without frequency data
const NUMERIC_WORD_PENALTY = 1_000_000; // Penalty for words containing numbers
const UNKNOWN_WORD_PENALTY = 100_000; // Base penalty for unknown words

// Pre-compiled regex for hot path performance
const NUMERIC_REGEX = /[0-9]/;

/**
 * Scores a word for ranking - lower score is better (more common).
 * Used for sorting homophones by likelihood.
 */
export function scoreWord(word: string): number {
  const frequency = getWordFrequency(word);

  // Boost common contractions - they're usually more common than their
  // homophones (e.g., "won't" vs archaic "wont")
  const isCommonContraction = COMMON_CONTRACTIONS.has(word.toLowerCase());

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
  return [...words].sort((a, b) => scoreWord(a) - scoreWord(b));
}
