/**
 * Reverse dictionary: phoneme sequence -> English words.
 *
 * Used for reverse translation (Ingglish/IPA -> English).
 * Pre-built at build time with words sorted by frequency.
 */

import { stripStress } from '@ingglish/phonemes';
import { CUSTOM_PRONUNCIATIONS } from './custom-words';
import { sortByFrequency } from './frequency';
import { createLazyLoader } from './lazy-loader';
import type { ReverseDictionary } from './types';

/**
 * Build a reverse map from custom pronunciations (phoneme key -> words).
 * Computed once and cached. Custom words are prepended so they take priority.
 */
let customReverseMap: null | Record<string, string[]> = null;
function getCustomReverseMap(): Record<string, string[]> {
  if (customReverseMap) {
    return customReverseMap;
  }
  customReverseMap = {};
  for (const [word, phonemes] of Object.entries(CUSTOM_PRONUNCIATIONS)) {
    const key = phonemes.map((p) => stripStress(p)).join(' ');
    customReverseMap[key] ??= [];
    customReverseMap[key].push(word);
  }
  return customReverseMap;
}

const loader = createLazyLoader<ReverseDictionary>(async () => {
  const mod = await import('./reverse-cmudict');
  return mod.default;
}, 'Reverse dictionary');

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
 * Clears the reverse dictionary cache.
 * Useful for testing.
 */
export function clearReverseDictionaryCache(): void {
  loader.reset();
}

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

  // Merge custom and dict words, deduplicate, then sort by frequency.
  // Custom words correct CMU pronunciations but shouldn't override
  // frequency ranking (e.g., "hors" shouldn't beat "or" for AO+R).
  const seen = new Set(customMatches);
  const merged = [...customMatches, ...dictMatches.filter((w) => !seen.has(w))];
  return sortByFrequency(merged);
}
