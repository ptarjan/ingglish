/**
 * Word frequency scoring using SUBTLEX corpus data.
 * Used for selecting the most common word among homophones.
 */
import wordFrequencies from 'subtlex-word-frequencies';

// Build frequency map at module load time for O(1) lookups
const frequencyMap: Map<string, number> = new Map();
for (const { word, count } of wordFrequencies) {
  frequencyMap.set(word.toLowerCase(), count);
}

/**
 * Returns the frequency count for a word (higher = more common).
 * Returns undefined if word is not in the corpus.
 */
export function getWordFrequency(word: string): number | undefined {
  return frequencyMap.get(word.toLowerCase());
}

/**
 * Scores a word for ranking - lower score is better (more common).
 * Used for sorting homophones by likelihood.
 */
export function scoreWord(word: string): number {
  const frequency = getWordFrequency(word);

  if (frequency !== undefined) {
    return -frequency; // Negate so higher frequency = lower (better) score
  }

  // Penalize words with numbers (likely variant spellings like HELLO2)
  if (/[0-9]/.test(word)) {
    return 1_000_000 + word.length;
  }

  // Unknown words: penalize by length (shorter usually more common)
  return 100_000 + word.length;
}

/**
 * Sorts words by frequency (most common first).
 */
export function sortByFrequency(words: string[]): string[] {
  return [...words].sort((a, b) => scoreWord(a) - scoreWord(b));
}
