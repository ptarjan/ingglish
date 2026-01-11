/**
 * CMU Dictionary loading and caching.
 *
 * Dictionary sourced from: https://github.com/cmusphinx/cmudict
 */

import type { CMUDictionary } from '../types';

// The dictionary will be loaded once and cached
let dictionary: CMUDictionary | null = null;
let dictionaryPromise: Promise<CMUDictionary> | null = null;

/**
 * Loads the CMU Pronouncing Dictionary.
 * The dictionary is cached after first load.
 */
export async function loadDictionary(): Promise<CMUDictionary> {
  if (dictionary) {
    return dictionary;
  }

  if (dictionaryPromise) {
    return dictionaryPromise;
  }

  dictionaryPromise = import('./cmudict')
    .then((module: { default: CMUDictionary }) => {
      dictionary = module.default;
      return dictionary;
    })
    .catch((error: unknown) => {
      dictionaryPromise = null; // Reset so retry is possible
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to load CMU dictionary: ${message}`);
    });

  return dictionaryPromise;
}

/**
 * Gets the dictionary synchronously.
 * Throws if dictionary hasn't been loaded yet.
 */
export function getDictionary(): CMUDictionary {
  if (!dictionary) {
    throw new Error('Dictionary not loaded. Call loadDictionary() first.');
  }
  return dictionary;
}

/**
 * Checks if the dictionary is loaded.
 */
export function isDictionaryLoaded(): boolean {
  return dictionary !== null;
}
