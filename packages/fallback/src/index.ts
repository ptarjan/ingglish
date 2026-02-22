/**
 * Fallback strategies for translating unknown words.
 *
 * Strategy order:
 * 1. Custom pronunciations (tech terms, brand names)
 * 2. Initialisms (spell out letters: URL -> you-are-ell)
 * 3. British spelling normalization (colour -> color)
 * 4. Compound word splitting (github -> git + hub)
 * 5. Stemming (find known base word + known suffix)
 * 6. Rule-based grapheme-to-phoneme
 */

import { getCustomPronunciation } from '@ingglish/dictionary';
import { wordToPhonetic, wordToArpabetTraced } from '@ingglish/g2p';
import type { G2PTrace } from '@ingglish/g2p';
import { arpabetToFormat } from '@ingglish/phonemes';
import type { OutputFormat } from '@ingglish/phonemes';
import {
  isInitialism,
  parseInitialismWithSuffix,
  translateAsAcronym,
  LETTER_PHONEMES,
  INITIALISM_EXPANSIONS,
} from './acronyms';
import { translateAsBritish, matchBritish } from './british';
import { translateAsCompound, dpDecompose } from './compounds';
import { translateWithStemming, matchStemming } from './stemming';

export type WordDiagnosis =
  | { strategy: 'custom'; phonemes: string[] }
  | { strategy: 'initialism' }
  | { strategy: 'british'; americanSpelling: string; phonemes: string[] }
  | { strategy: 'compound'; parts: string[] }
  | { strategy: 'stemming'; prefix?: string; stem: string; suffix?: string }
  | { strategy: 'g2p'; trace: G2PTrace };

export {
  LETTER_PHONEMES,
  INITIALISM_EXPANSIONS,
  isInitialism,
  parseInitialismWithSuffix,
  translateAsAcronym,
  translateAsBritish,
  matchBritish,
  translateAsCompound,
  translateWithStemming,
};

interface FallbackResult {
  strategy: string;
  translated: string;
}

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

  // Fall back to grapheme-to-phoneme rules
  return { strategy: 'g2p', translated: wordToPhonetic(word, format) };
}

/**
 * Attempts all strategies to translate an unknown word.
 *
 * @param word The unknown word
 * @param format The output format
 * @returns The translated word
 */
export function translateUnknown(word: string, format: OutputFormat = 'ingglish'): string {
  return translateUnknownCore(word, format).translated;
}

/**
 * Diagnoses an unknown word by determining which fallback strategy handles it
 * and collecting diagnostic data for display.
 *
 * Returns null for obvious non-words (3+ repeated chars, no vowels).
 */
export function diagnoseUnknown(word: string): WordDiagnosis | null {
  if (/(.)\1\1/.test(word) || !/[aeiouy]/i.test(word)) {
    return null;
  }
  const { strategy } = translateUnknownCore(word, 'ingglish');
  switch (strategy) {
    case 'custom':
      return { strategy: 'custom', phonemes: getCustomPronunciation(word)! };
    case 'initialism':
      return { strategy: 'initialism' };
    case 'british': {
      const m = matchBritish(word)!;
      return { strategy: 'british', americanSpelling: m.american, phonemes: m.phonemes };
    }
    case 'compound':
      return { strategy: 'compound', parts: dpDecompose(word.toLowerCase())! };
    case 'stemming': {
      const m = matchStemming(word)!;
      return { strategy: 'stemming', prefix: m.prefix, stem: m.stem, suffix: m.suffix };
    }
    case 'g2p':
      return { strategy: 'g2p', trace: wordToArpabetTraced(word) };
  }
}
