/**
 * CMU Dictionary loading and caching.
 *
 * Dictionary sourced from: https://github.com/cmusphinx/cmudict
 */

import type { CMUDictionary } from './types';
import { createLazyLoader } from './lazy-loader';

const loader = createLazyLoader<CMUDictionary>(
  async () => (await import('./cmudict')).default,
  'CMU dictionary'
);

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
