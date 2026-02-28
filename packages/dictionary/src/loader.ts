/**
 * CMU Dictionary loading and caching.
 *
 * Dictionary sourced from: https://github.com/cmusphinx/cmudict
 */

import { createLazyLoader } from './lazy-loader';
import { loadJson } from './load-json';
import type { CMUDictionary } from './types';

const loader = createLazyLoader<CMUDictionary>(async () => {
  // Velar nasal normalization (N → NG before K/G) is done at build time
  // by scripts/build-dictionary.ts — no runtime normalization needed.
  const json = await loadJson<CMUDictionary>('cmudict');
  if (json !== null) {
    const dict = json;
    Object.setPrototypeOf(dict, null);
    return dict;
  }
  const mod = await import('./cmudict');
  const dict = mod.default;
  // Remove prototype so `key in dict` is safe (no "constructor", "toString", etc.)
  // This lets lookups use `in` instead of Object.prototype.hasOwnProperty.call.
  Object.setPrototypeOf(dict, null);
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
