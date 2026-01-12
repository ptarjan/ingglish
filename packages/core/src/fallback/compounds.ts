/**
 * Compound word detection and translation.
 *
 * Handles words like "github" by splitting into "git" + "hub".
 * Preserves camelCase: "iCloud" -> "ie" + "Klowd" = "ieKlowd"
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import { lookupPronunciation } from '../dictionary/lookup';
import { getCustomPronunciation } from './custom-words';
import type { OutputFormat } from '../types';

/**
 * Checks if a character is uppercase.
 */
function isUpperCase(char: string): boolean {
  return char === char.toUpperCase() && char !== char.toLowerCase();
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalize(str: string): string {
  if (str.length === 0) {
    return str;
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Attempts to translate an unknown word by splitting it into compound parts.
 * Tries to find a split point where both parts are known dictionary words.
 * Preserves camelCase by capitalizing each component appropriately.
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

  // Try each possible split point (minimum 1 char on left for prefixes like "i", 2 on right)
  for (let i = 1; i < lowerWord.length - 1; i++) {
    const left = lowerWord.slice(0, i);
    const right = lowerWord.slice(i);

    // Look up in custom dictionary first, then CMU
    const leftPhonemes = getCustomPronunciation(left) ?? lookupPronunciation(left);
    const rightPhonemes = getCustomPronunciation(right) ?? lookupPronunciation(right);

    if (leftPhonemes && rightPhonemes) {
      // Both parts are known words - translate each part
      let leftTranslated = arpabetToFormat(leftPhonemes, format);
      let rightTranslated = arpabetToFormat(rightPhonemes, format);

      // For Ingglish output, preserve case per component
      if (format === 'ingglish') {
        const originalLeft = word.slice(0, i);
        const originalRight = word.slice(i);

        // If the left part started uppercase, capitalize it
        if (originalLeft.length > 0 && isUpperCase(originalLeft[0])) {
          leftTranslated = capitalize(leftTranslated);
        }

        // If the right part started uppercase, capitalize it
        if (originalRight.length > 0 && isUpperCase(originalRight[0])) {
          rightTranslated = capitalize(rightTranslated);
        }
      }

      return leftTranslated + rightTranslated;
    }
  }

  return null;
}
