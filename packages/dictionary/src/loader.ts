/**
 * CMU Dictionary loading and caching.
 *
 * Dictionary sourced from: https://github.com/cmusphinx/cmudict
 */

import type { CMUDictionary } from './types';

// The dictionary will be loaded once and cached
let dictionary: CMUDictionary | null = null;
let dictionaryPromise: Promise<CMUDictionary> | null = null;

/**
 * Fast JSON.parse loader for Node.js (18x faster than dynamic import).
 * Falls back to dynamic import for browser environment.
 */
async function loadDictionaryFast(): Promise<CMUDictionary> {
  // Use fast readFileSync + JSON.parse in Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    const fs = await import('fs');
    const url = await import('url');
    const path = await import('path');
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const filepath = path.join(__dirname, 'cmudict.js');
    const content = fs.readFileSync(filepath, 'utf8');
    // Extract JSON from JS file (skip "const cmudict = " and ";\nexport...")
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    return JSON.parse(content.slice(jsonStart, jsonEnd)) as CMUDictionary;
  }

  // Browser: use dynamic import
  const module = await import('./cmudict');
  return module.default;
}

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

  dictionaryPromise = loadDictionaryFast()
    .then((data) => {
      dictionary = data;
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
