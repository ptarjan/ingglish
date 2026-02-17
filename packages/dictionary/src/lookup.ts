/**
 * Dictionary lookup utilities.
 */

import { getDictionary } from './loader';
import { getCustomPronunciation } from './custom-words';

/**
 * Looks up a word in the CMU dictionary.
 * Custom pronunciations override dictionary entries.
 * @param word The word to look up (case insensitive)
 * @returns Array of phonemes, or null if not found
 */
export function lookupPronunciation(word: string): string[] | null {
  const key = word.toLowerCase();

  // Check custom pronunciations first (overrides dictionary)
  const custom = getCustomPronunciation(key);
  if (custom) {
    return custom;
  }

  const dict = getDictionary();
  // Dictionary values are already pre-split arrays (done at build time)
  // Use hasOwn to avoid prototype properties like "constructor", "toString"
  return Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : null;
}

/**
 * Checks if a word exists in the dictionary.
 */
export function hasWord(word: string): boolean {
  const dict = getDictionary();
  return Object.prototype.hasOwnProperty.call(dict, word.toLowerCase());
}
