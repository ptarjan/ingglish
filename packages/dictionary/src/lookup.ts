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
  // Dictionary values are already pre-split arrays (done at build time)
  // Use hasOwn to avoid prototype properties like "constructor", "toString"
  if (!Object.prototype.hasOwnProperty.call(dict, key)) {
    return null;
  }

  // Fix systematic CMU error: N before K/G should be NG
  return normalizeVelarNasal(dict[key]!);
}

/**
 * Normalizes N → NG before velar consonants K and G.
 * In English, /n/ always assimilates to [ŋ] before /k/ or /g/.
 * CMU convention uses NG (e.g., "think" = TH IH1 NG K),
 * but hundreds of entries incorrectly use N.
 */
function normalizeVelarNasal(phonemes: string[]): string[] {
  let needsFix = false;
  for (let i = 0; i < phonemes.length - 1; i++) {
    if (phonemes[i] === 'N' && (phonemes[i + 1] === 'K' || phonemes[i + 1] === 'G')) {
      needsFix = true;
      break;
    }
  }
  if (!needsFix) {
    return phonemes;
  }

  const result = [...phonemes];
  for (let i = 0; i < result.length - 1; i++) {
    if (result[i] === 'N' && (result[i + 1] === 'K' || result[i + 1] === 'G')) {
      result[i] = 'NG';
    }
  }
  return result;
}
