/**
 * Contraction translation handling.
 *
 * Handles words with apostrophes like "don't", "I'm", etc.
 */

import { lookupPronunciation } from '@ingglish/dictionary';
import { detectCasePattern, applyCasePattern } from '@ingglish/normalize';
import type { OutputFormat } from '@ingglish/phonemes';
import { arpabetToFormat, getFormatPreservesCase } from '@ingglish/phonemes';

/**
 * Translates a contraction (word with apostrophe).
 * First tries to look up the whole contraction in the dictionary.
 * Falls back to translating parts separately while preserving the apostrophe.
 *
 * @param token - The contraction to translate (e.g., "don't")
 * @param format - The output format ('ingglish' or 'ipa')
 * @param translateWord - Function to translate individual word parts
 * @returns The translated contraction
 */
export function translateContraction(
  token: string,
  format: OutputFormat,
  translateWord: (word: string, format: OutputFormat) => string
): string {
  // Try to look up the whole contraction (with apostrophe) in dictionary
  const phonemes = lookupPronunciation(token);

  if (phonemes) {
    // Found the whole contraction - translate it as a unit
    const translated = arpabetToFormat(phonemes, format);

    // Preserve case (only for formats that preserve case)
    if (getFormatPreservesCase(format)) {
      // Special case: I-contractions (I'm, I'll, I've, I'd) should be lowercase
      // because "I" is only capitalized in English by convention, not phonetically special
      if (token.toLowerCase().startsWith("i'")) {
        return translated.toLowerCase();
      }
      const casePattern = detectCasePattern(token);
      return applyCasePattern(translated, casePattern, token);
    }
    return translated;
  }

  // Fallback: translate parts separately, preserving apostrophe
  const parts = token.split("'");
  return parts
    .map((p, i) => {
      if (!p) {
        return '';
      }
      if (i > 0 && p.toLowerCase() === 't') {
        return 't'; // Keep 't' as-is for n't contractions not in dictionary
      }
      return translateWord(p, format);
    })
    .join("'");
}
