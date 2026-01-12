/**
 * Reverse dictionary: phoneme sequence -> English words.
 *
 * Used for reverse translation (Ingglish/IPA -> English).
 * Pre-built at build time with words sorted by frequency.
 */

import type { ReverseDictionary } from '../types';

// The reverse dictionary will be loaded once and cached
let reverseDict: ReverseDictionary | null = null;
let reverseDictPromise: Promise<ReverseDictionary> | null = null;

/**
 * Loads the pre-built reverse dictionary.
 * The dictionary is cached after first load.
 */
export async function loadReverseDictionary(): Promise<ReverseDictionary> {
  if (reverseDict) {
    return reverseDict;
  }

  if (reverseDictPromise) {
    return reverseDictPromise;
  }

  reverseDictPromise = import('./reverse-cmudict')
    .then((module: { default: ReverseDictionary }) => {
      reverseDict = module.default;
      return reverseDict;
    })
    .catch((error: unknown) => {
      reverseDictPromise = null;
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load reverse dictionary: ${message}`);
    });

  return reverseDictPromise;
}

/**
 * Gets the reverse dictionary synchronously.
 * Throws if dictionary hasn't been loaded yet.
 */
export function getReverseDictionary(): ReverseDictionary {
  if (!reverseDict) {
    throw new Error('Reverse dictionary not loaded. Call loadReverseDictionary() first.');
  }
  return reverseDict;
}

/**
 * Looks up words for a phoneme key.
 * Returns words sorted by frequency (pre-sorted at build time).
 */
export function lookupPhonemeKey(key: string): string[] | undefined {
  const dict = getReverseDictionary();
  return dict[key];
}

/**
 * Clears the reverse dictionary cache.
 * Useful for testing.
 */
export function clearReverseDictionaryCache(): void {
  reverseDict = null;
  reverseDictPromise = null;
}
