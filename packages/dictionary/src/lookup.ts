/**
 * Dictionary lookup utilities.
 */

import { getCustomPronunciation } from './custom-words';
import { getDictionary } from './loader';

/**
 * Looks up a word in the CMU dictionary, returning the ARPAbet IR.
 * Custom pronunciations override dictionary entries.
 * @param word The word to look up (case insensitive)
 * @returns ARPAbet phoneme array (the pipeline IR), or null if not found
 */
export function lookupPronunciation(word: string): null | string[] {
  return lookupPronunciationLower(word.toLowerCase());
}

/**
 * Like {@link lookupPronunciation}, but takes a **pre-lowercased** key.
 * Skips the `.toLowerCase()` call — use when the caller has already
 * confirmed the key is lowercase (e.g., fast-path code).
 */
export function lookupPronunciationLower(key: string): null | string[] {
  // Check custom pronunciations first (overrides dictionary)
  const custom = getCustomPronunciation(key);
  if (custom) {
    return custom;
  }

  // Dictionary has null prototype (set at load time), so `in` is safe
  // and avoids the overhead of Object.prototype.hasOwnProperty.call.
  const dict = getDictionary();
  if (!(key in dict)) {
    return null;
  }

  return dict[key]!;
}
