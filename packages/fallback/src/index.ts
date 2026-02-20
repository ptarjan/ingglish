/**
 * Fallback strategies for translating unknown words.
 *
 * Strategy order:
 * 1. Custom pronunciations (tech terms, brand names)
 * 2. Initialisms (spell out letters: URL -> you-are-ell)
 * 3. British spelling normalization (colour -> color)
 * 4. Compound word splitting (github -> git + hub)
 * 5. Stemming (find known base word + known suffix)
 * 6. Neural G2P via phonemize (if available)
 * 7. Rule-based grapheme-to-phoneme
 */

import { arpabetToFormat } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import { getCustomPronunciation } from '@ingglish/dictionary';
import {
  isInitialism,
  parseInitialismWithSuffix,
  translateAsAcronym,
  LETTER_PHONEMES,
  KNOWN_INITIALISMS,
  INITIALISM_EXPANSIONS,
} from './acronyms';
import { translateAsBritish, diagnoseBritish } from './british';
import { translateAsCompound } from './compounds';
import { dpDecompose } from './compounds';
import {
  translateWithStemming,
  diagnoseStemming,
  SUFFIX_PHONEMES,
  PREFIX_PHONEMES,
} from './stemming';
import type { StemmingResult } from './stemming';
import { translateWithPhonemize, preloadPhonemize } from './phonemize';
import { translateWithRules } from '@ingglish/g2p';

export type FallbackStrategy =
  | 'custom'
  | 'initialism'
  | 'british'
  | 'compound'
  | 'stemming'
  | 'phonemize'
  | 'g2p';

export interface FallbackResult {
  strategy: FallbackStrategy;
  translated: string;
}

export {
  LETTER_PHONEMES,
  KNOWN_INITIALISMS,
  INITIALISM_EXPANSIONS,
  isInitialism,
  parseInitialismWithSuffix,
  translateAsAcronym,
  translateAsBritish,
  diagnoseBritish,
  translateAsCompound,
  dpDecompose as decomposeCompound,
  SUFFIX_PHONEMES,
  PREFIX_PHONEMES,
  translateWithStemming,
  diagnoseStemming,
  translateWithPhonemize,
  preloadPhonemize,
};
export type { StemmingResult };

/**
 * Core implementation that returns both the strategy used and the translated word.
 */
function translateUnknownCore(word: string, format: OutputFormat): FallbackResult {
  // Check custom pronunciations first
  const customPhonemes = getCustomPronunciation(word);
  if (customPhonemes !== undefined) {
    return { strategy: 'custom', translated: arpabetToFormat(customPhonemes, format) };
  }

  // Check for initialisms (URL -> yooahrel)
  if (isInitialism(word)) {
    return { strategy: 'initialism', translated: translateAsAcronym(word, format) };
  }

  // Try British spelling normalization (colour -> color)
  const britishResult = translateAsBritish(word, format);
  if (britishResult !== null && britishResult.length > 0) {
    return { strategy: 'british', translated: britishResult };
  }

  // Try compound word splitting (github -> git + hub)
  const compoundResult = translateAsCompound(word, format);
  if (compoundResult !== null && compoundResult.length > 0) {
    return { strategy: 'compound', translated: compoundResult };
  }

  // Try stemming
  const stemmedResult = translateWithStemming(word, format);
  if (stemmedResult !== null && stemmedResult.length > 0) {
    return { strategy: 'stemming', translated: stemmedResult };
  }

  // Try phonemize if loaded
  // Skip if the result round-trips back to the original word (e.g. phonemize
  // maps "splonk" → IPA → arpabet → ingglish "splonk" unchanged).
  const phonemizeResult = translateWithPhonemize(word, format);
  if (
    phonemizeResult !== null &&
    phonemizeResult.length > 0 &&
    phonemizeResult.toLowerCase() !== word.toLowerCase()
  ) {
    return { strategy: 'phonemize', translated: phonemizeResult };
  }

  // Fall back to grapheme-to-phoneme rules
  return { strategy: 'g2p', translated: translateWithRules(word, format) };
}

/**
 * Attempts all strategies to translate an unknown word.
 *
 * Strategy order:
 * 1. Check custom pronunciations first
 * 2. Check if it's an acronym (spell out letters)
 * 3. Try British spelling normalization (colour -> color)
 * 4. Try compound word splitting (git+hub)
 * 5. Try stemming (find known base word + known suffix)
 * 6. Try phonemize (neural G2P) if available
 * 7. Try grapheme-to-phoneme rules
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The translated word
 */
export function translateUnknown(word: string, format: OutputFormat = 'ingglish'): string {
  return translateUnknownCore(word, format).translated;
}

/**
 * Diagnoses which fallback strategy would be used for a word.
 * Returns null for obvious non-words (3+ repeated chars, no vowels).
 */
export function diagnoseFallback(word: string): FallbackStrategy | null {
  // Pass through obvious non-words (mirrors check in forward.ts)
  if (/(.)\1\1/i.test(word) || !/[aeiouy]/i.test(word)) {
    return null;
  }
  return translateUnknownCore(word, 'ingglish').strategy;
}
