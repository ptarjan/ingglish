/**
 * Contraction translation handling.
 *
 * Handles words with apostrophes like "don't", "I'm", etc.
 */

import { arpabetToFormat } from '../convert/to-ingglish';
import { lookupPronunciation } from '../dictionary/lookup';
import { detectCasePattern, applyCasePattern } from '../utils/case';
import type { OutputFormat } from '../types';

// Forward declaration - will be imported from forward.ts
type TranslateWordFn = (word: string, format: OutputFormat) => string;
let translateWordFn: TranslateWordFn | null = null;

/**
 * Sets the translateWord function reference.
 * Called by forward.ts to avoid circular dependency.
 */
export function setTranslateWordFn(fn: TranslateWordFn): void {
  translateWordFn = fn;
}

/**
 * Translates a contraction (word with apostrophe).
 * First tries to look up the whole contraction in the dictionary.
 * Returns the translation without apostrophe for consistent round-tripping.
 *
 * @param token - The contraction to translate (e.g., "don't")
 * @param format - The output format ('ingglish' or 'ipa')
 * @returns The translated contraction
 */
export function translateContraction(token: string, format: OutputFormat = 'ingglish'): string {
  // Try to look up the whole contraction (with apostrophe) in dictionary
  const phonemes = lookupPronunciation(token);

  if (phonemes) {
    // Found the whole contraction - translate it as a unit
    const translated = arpabetToFormat(phonemes, format);

    // Preserve case (only for Ingglish), but not for I-contractions (I'm, I'll, I've, I'd)
    // since "I" is only capitalized due to English grammar rules
    if (format === 'ingglish') {
      const isIContraction = /^I'/i.test(token);
      if (!isIContraction) {
        const casePattern = detectCasePattern(token);
        return applyCasePattern(translated, casePattern, token);
      }
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
      // Use the registered translateWord function
      if (translateWordFn) {
        return translateWordFn(p, format);
      }
      return p;
    })
    .join("'");
}
