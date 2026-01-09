/**
 * Compound word detection and translation.
 *
 * Handles words like "github" by splitting into "git" + "hub".
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import { lookupPronunciation } from '../dictionary/lookup';
import { getCustomPronunciation } from './custom-words';
import type { OutputFormat } from '../types';

/**
 * Looks up pronunciation in custom dictionary or CMU.
 * Custom pronunciations take precedence.
 */
function lookupWithCustom(word: string): string[] | null {
  const custom = getCustomPronunciation(word);
  if (custom !== undefined) {
    return custom;
  }
  return lookupPronunciation(word);
}

/**
 * Attempts to translate an unknown word by splitting it into compound parts.
 * Tries to find a split point where both parts are known dictionary words.
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The translated word, or null if no valid split found
 */
export function translateAsCompound(
  word: string,
  format: OutputFormat = 'ingglish'
): string | null {
  const lowerWord = word.toLowerCase();

  // Try each possible split point (minimum 2 chars each side)
  for (let i = 2; i < lowerWord.length - 1; i++) {
    const left = lowerWord.slice(0, i);
    const right = lowerWord.slice(i);

    const leftPhonemes = lookupWithCustom(left);
    const rightPhonemes = lookupWithCustom(right);

    if (leftPhonemes && rightPhonemes) {
      // Both parts are known words - combine their pronunciations
      const combined = [...leftPhonemes, ...rightPhonemes];
      return arpabetToFormat(combined, format);
    }
  }

  return null;
}
