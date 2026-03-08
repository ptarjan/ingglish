/**
 * Fallback strategies for translating unknown words.
 *
 * Called when a word isn't in the dictionary. Each strategy ultimately
 * produces ARPAbet `string[]` (the pipeline IR), which is then passed
 * through `arpabetToFormat()` for final output.
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
import type { G2PTrace } from '@ingglish/g2p';
import { wordToArpabetTraced, wordToPhonetic } from '@ingglish/g2p';
import type { OutputFormat } from '@ingglish/phonemes';
import { arpabetToFormat } from '@ingglish/phonemes';
import { isInitialism, translateAsAcronym } from './acronyms';
import type { LookupFn } from './british';
import { matchBritish, translateAsBritish } from './british';
import type { FreqFn } from './compounds';
import { dpDecompose, translateAsCompound } from './compounds';
import { matchStemming, translateWithStemming } from './stemming';

export type WordDiagnosis =
  | { americanSpelling: string; phonemes: string[]; strategy: 'british' }
  | { parts: string[]; strategy: 'compound' }
  | { phonemes: string[]; strategy: 'custom' }
  | { prefix?: string; stem: string; strategy: 'stemming'; suffix?: string }
  | { strategy: 'g2p'; trace: G2PTrace }
  | { strategy: 'initialism' };

interface FallbackResult {
  strategy: FallbackStrategy;
  translated: string;
}

export {
  isInitialism,
  KNOWN_INITIALISMS,
  LETTER_PHONEMES,
  parseInitialismWithSuffix,
  translateAsAcronym,
} from './acronyms';
export { matchBritish } from './british';
export { dpDecompose } from './compounds';
export { matchStemming } from './stemming';

type FallbackStrategy = 'british' | 'compound' | 'custom' | 'g2p' | 'initialism' | 'stemming';

/**
 * Diagnoses an unknown word by determining which fallback strategy handles it
 * and collecting diagnostic data for display.
 *
 * Returns null for obvious non-words (3+ repeated chars, no vowels).
 */
export function diagnoseUnknown(word: string): null | WordDiagnosis {
  if (/(.)\1\1/.test(word) || !/[aeiouy]/i.test(word)) {
    return null;
  }
  const { strategy } = translateUnknownCore(word, 'ingglish');
  switch (strategy) {
    case 'british': {
      const m = matchBritish(word)!;
      return { americanSpelling: m.american, phonemes: m.phonemes, strategy: 'british' };
    }
    case 'compound': {
      return { parts: dpDecompose(word.toLowerCase())!, strategy: 'compound' };
    }
    case 'custom': {
      return { phonemes: getCustomPronunciation(word)!, strategy: 'custom' };
    }
    case 'g2p': {
      return { strategy: 'g2p', trace: wordToArpabetTraced(word) };
    }
    case 'initialism': {
      return { strategy: 'initialism' };
    }
    case 'stemming': {
      const m = matchStemming(word)!;
      return { prefix: m.prefix, stem: m.stem, strategy: 'stemming', suffix: m.suffix };
    }
  }
}

/**
 * Attempts all strategies to translate an unknown word.
 *
 * @param word The unknown word
 * @param format The output format
 * @param lookup Optional lookup function (defaults to CMU dict lookupPronunciation)
 * @param getFreq Optional frequency function (defaults to CMU word frequencies)
 * @returns The translated word
 */
export function translateUnknown(
  word: string,
  format: OutputFormat = 'ingglish',
  lookup?: LookupFn,
  getFreq?: FreqFn
): string {
  return translateUnknownCore(word, format, lookup, getFreq).translated;
}

/**
 * Core implementation that returns both the strategy used and the translated word.
 */
function translateUnknownCore(
  word: string,
  format: OutputFormat,
  lookup?: LookupFn,
  getFreq?: FreqFn
): FallbackResult {
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
  const britishResult = translateAsBritish(word, format, lookup);
  if (britishResult !== null) {
    return { strategy: 'british', translated: britishResult };
  }

  // Try compound word splitting (github -> git + hub)
  const compoundResult = translateAsCompound(word, format, lookup, getFreq);
  if (compoundResult !== null) {
    return { strategy: 'compound', translated: compoundResult };
  }

  // Try stemming
  const stemmedResult = translateWithStemming(word, format, lookup);
  if (stemmedResult !== null) {
    return { strategy: 'stemming', translated: stemmedResult };
  }

  // Fall back to grapheme-to-phoneme rules
  return { strategy: 'g2p', translated: wordToPhonetic(word, format) };
}
