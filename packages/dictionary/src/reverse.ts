/**
 * Reverse dictionary: phoneme sequence -> English words.
 *
 * Used for reverse translation (Ingglish/IPA -> English).
 * Pre-built at build time with words sorted by frequency.
 */

import type { ReverseDictionary } from './types';

// The reverse dictionary will be loaded once and cached
let reverseDict: ReverseDictionary | null = null;
let reverseDictPromise: Promise<ReverseDictionary> | null = null;

/**
 * Fast JSON.parse loader for Node.js (18x faster than dynamic import).
 * Falls back to dynamic import for browser environment.
 */
async function loadReverseDictionaryFast(): Promise<ReverseDictionary> {
  // Use fast readFileSync + JSON.parse in Node.js
  if (typeof process !== 'undefined' && process.versions?.node) {
    const fs = await import('fs');
    const url = await import('url');
    const path = await import('path');
    const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
    const filepath = path.join(__dirname, 'reverse-cmudict.js');
    const content = fs.readFileSync(filepath, 'utf8');
    const jsonStart = content.indexOf('{');
    const jsonEnd = content.lastIndexOf('}') + 1;
    return JSON.parse(content.slice(jsonStart, jsonEnd)) as ReverseDictionary;
  }

  // Browser: use dynamic import
  const module = await import('./reverse-cmudict');
  return module.default;
}

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

  reverseDictPromise = loadReverseDictionaryFast()
    .then((data) => {
      reverseDict = data;
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
