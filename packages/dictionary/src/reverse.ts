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

const loader = createLazyLoader<ReverseDictionary>(async () => {
  const mod = await import('./reverse-cmudict');
  const dict = mod.default;

  // Merge custom pronunciations into the dictionary once at load time.
  // Custom words correct CMU pronunciations but shouldn't override
  // frequency ranking (e.g., "hors" shouldn't beat "or" for AO+R).
  for (const [word, phonemes] of Object.entries(CUSTOM_PRONUNCIATIONS)) {
    const key = phonemes.map((p) => stripStress(p)).join(' ');
    const existing = dict[key];
    if (existing === undefined) {
      dict[key] = [word];
    } else if (!existing.includes(word)) {
      existing.push(word);
      dict[key] = sortByFrequency(existing);
    }
  }

  return dict;
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
 * Results are pre-merged and frequency-sorted at load time.
 */
export function lookupPhonemeKey(key: string): string[] | undefined {
  return getReverseDictionary()[key];
}
