/**
 * Dictionary lookup utilities.
 */

import { getCustomPronunciation } from './custom-words';
import { getDictionary } from './loader';

/**
 * Checks if a word exists in the dictionary.
 */
export function hasWord(word: string): boolean {
  const dict = getDictionary();
  return Object.prototype.hasOwnProperty.call(dict, word.toLowerCase());
}

/**
 * Looks up a word in the CMU dictionary.
 * Custom pronunciations override dictionary entries.
 * @param word The word to look up (case insensitive)
 * @returns Array of phonemes, or null if not found
 */
export function lookupPronunciation(word: string): null | string[] {
  const key = word.toLowerCase();

  // Check custom pronunciations first (overrides dictionary)
  const custom = getCustomPronunciation(key);
  if (custom) {
    return custom;
  }

  const dict = getDictionary();
  // Dictionary values are already pre-split arrays (done at build time).
  // Velar nasal normalization (N → NG before K/G) is applied at load time.
  // Use hasOwn to avoid prototype properties like "constructor", "toString"
  if (!Object.prototype.hasOwnProperty.call(dict, key)) {
    return null;
  }

  return dict[key]!;
}
