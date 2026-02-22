/**
 * Reverse dictionary: phoneme sequence -> English words.
 *
 * Used for reverse translation (Ingglish/IPA -> English).
 * Pre-built at build time with words sorted by frequency.
 */

import { stripStress } from '@ingglish/phonemes';
import { CUSTOM_PRONUNCIATIONS } from './custom-words';
import { createLazyLoader } from './lazy-loader';
import type { ReverseDictionary } from './types';

/**
 * Build a reverse map from custom pronunciations (phoneme key -> words).
 * Computed once and cached. Custom words are prepended so they take priority.
 */
let customReverseMap: Record<string, string[]> | null = null;
function getCustomReverseMap(): Record<string, string[]> {
  if (customReverseMap) {
    return customReverseMap;
  }
  customReverseMap = {};
  for (const [word, phonemes] of Object.entries(CUSTOM_PRONUNCIATIONS)) {
    const key = phonemes.map(stripStress).join(' ');
    customReverseMap[key] ??= [];
    customReverseMap[key].push(word);
  }
  return customReverseMap;
}

const loader = createLazyLoader<ReverseDictionary>(
  async () => (await import('./reverse-cmudict')).default,
  'Reverse dictionary'
);

/**
 * Loads the pre-built reverse dictionary.
 * The dictionary is cached after first load.
 */
export const loadReverseDictionary = loader.load.bind(loader);

/**
 * Gets the reverse dictionary synchronously.
 * Throws if dictionary hasn't been loaded yet.
 */
export const getReverseDictionary = loader.get.bind(loader);

/**
 * Looks up words for a phoneme key.
 * Custom pronunciations are checked first, then the pre-built reverse dictionary.
 * Results are merged with custom words taking priority.
 */
export function lookupPhonemeKey(key: string): string[] | undefined {
  const customMap = getCustomReverseMap();
  const customMatches = customMap[key];
  const dict = getReverseDictionary();
  const dictMatches = dict[key];

  if (customMatches === undefined) {
    return dictMatches;
  }
  if (dictMatches === undefined) {
    return customMatches;
  }

  // Merge: custom words first, then dict words (excluding duplicates)
  const seen = new Set(customMatches);
  return [...customMatches, ...dictMatches.filter((w) => !seen.has(w))];
}

/**
 * Clears the reverse dictionary cache.
 * Useful for testing.
 */
export function clearReverseDictionaryCache(): void {
  loader.reset();
}
