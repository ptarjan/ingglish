/**
 * CMU Dictionary loading and caching.
 *
 * Dictionary sourced from: https://github.com/cmusphinx/cmudict
 */

import { createLazyLoader } from './lazy-loader';
import type { CMUDictionary } from './types';

const loader = createLazyLoader<CMUDictionary>(async () => {
  const mod = await import('./cmudict');
  const dict = mod.default;
  // Pre-normalize velar nasals (N → NG before K/G) once at load time,
  // instead of scanning every phoneme array on each lookup.
  for (const phonemes of Object.values(dict)) {
    for (let i = 0; i < phonemes.length - 1; i++) {
      if (phonemes[i] === 'N' && (phonemes[i + 1] === 'K' || phonemes[i + 1] === 'G')) {
        phonemes[i] = 'NG';
      }
    }
  }
  return dict;
}, 'CMU dictionary');

/**
 * Loads the CMU Pronouncing Dictionary.
 * The dictionary is cached after first load.
 */
export const loadDictionary = loader.load.bind(loader);

/**
 * Gets the dictionary synchronously.
 * Throws if dictionary hasn't been loaded yet.
 */
export const getDictionary = loader.get.bind(loader);

/**
 * Checks if the dictionary is loaded.
 */
export const isDictionaryLoaded = loader.isLoaded.bind(loader);
