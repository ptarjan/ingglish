/**
 * Reverse dictionary: phoneme sequence -> English words.
 *
 * Used for reverse translation (Ingglish/IPA -> English).
 * Pre-built at build time with words sorted by frequency.
 */

import { stripStress } from '@ingglish/phonemes';
import { CUSTOM_PRONUNCIATIONS } from './custom-words';
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
  reverseDict = null;
  reverseDictPromise = null;
}
