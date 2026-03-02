/**
 * CMU Dictionary loading and caching.
 *
 * Dictionary sourced from: https://github.com/cmusphinx/cmudict
 *
 * The default loader reads from the bundled cmudict.js/.json.
 * Call {@link setDictionaryLoader} to override (e.g. fetch from en.json).
 */

import { createLazyLoader } from './lazy-loader';
import { loadJson } from './load-json';
import type { CMUDictionary } from './types';

let customLoader: (() => Promise<CMUDictionary>) | undefined;

/**
 * Override how the CMU dictionary is loaded.
 * Call before any translation to replace the default bundled-JS loader
 * with a custom one (e.g. fetching en.json from a CDN).
 */
export function setDictionaryLoader(loader: () => Promise<CMUDictionary>): void {
  customLoader = loader;
}

const loader = createLazyLoader<CMUDictionary>(async () => {
  let dict: CMUDictionary;
  if (customLoader) {
    dict = await customLoader();
  } else {
    // Velar nasal normalization (N → NG before K/G) is done at build time
    // by scripts/build-dictionary.ts — no runtime normalization needed.
    const json = await loadJson<CMUDictionary>('cmudict');
    dict = json ?? (await import('./cmudict')).default; // eslint-disable-line unicorn/no-await-expression-member
  }
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
