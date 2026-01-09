/**
 * Reverse dictionary: phoneme sequence -> English words.
 *
 * Used for reverse translation (Ingglish/IPA -> English).
 * Implements lazy sorting for performance optimization.
 */

import { getDictionary } from './loader';
import { sortByFrequency } from '../utils/frequency';

/** Raw reverse dictionary: phoneme sequence -> unsorted English words */
let reverseDictionaryCache: Map<string, string[]> | null = null;

/** Tracks which keys have been sorted (lazy sorting optimization) */
const sortedKeys = new Set<string>();

/**
 * Builds and caches a reverse dictionary: phoneme sequence -> English words.
 * Words are NOT sorted during build - sorting happens lazily on lookup.
 * This avoids O(n * m * log(m)) upfront cost for ~134k dictionary entries.
 */
function buildReverseDictionary(): Map<string, string[]> {
  if (reverseDictionaryCache) {
    return reverseDictionaryCache;
  }

  const dict = getDictionary();
  reverseDictionaryCache = new Map();

  for (const [word, pronunciation] of Object.entries(dict)) {
    const phonemeKey = pronunciation
      .split(' ')
      .map((p) => p.replace(/[012]$/, '')) // Strip stress markers
      .join(' ');

    const words = reverseDictionaryCache.get(phonemeKey) ?? [];
    words.push(word);
    reverseDictionaryCache.set(phonemeKey, words);
  }

  return reverseDictionaryCache;
}

/**
 * Pre-builds the reverse dictionary cache.
 * Call this during test setup to avoid the ~400ms cost on first lookup.
 */
export function warmReverseDictionaryCache(): void {
  buildReverseDictionary();
}

/**
 * Looks up words for a phoneme key, sorting by frequency on first access.
 * Lazy sorting means we only pay the cost for keys actually queried.
 */
export function lookupPhonemeKey(key: string): string[] | undefined {
  const reverseDict = buildReverseDictionary();
  const words = reverseDict.get(key);

  if (!words) {
    return undefined;
  }

  // Lazy sort: only sort this key's words on first access
  if (!sortedKeys.has(key)) {
    const sorted = sortByFrequency(words);
    reverseDict.set(key, sorted);
    sortedKeys.add(key);
    return sorted;
  }

  return words;
}

/**
 * Clears the reverse dictionary cache.
 * Useful for testing or when dictionary changes.
 */
export function clearReverseDictionaryCache(): void {
  reverseDictionaryCache = null;
  sortedKeys.clear();
}
