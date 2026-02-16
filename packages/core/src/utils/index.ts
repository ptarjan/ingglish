/**
 * Utility functions for text processing, case handling, and word frequency.
 */

export { type CasePattern, detectCasePattern, applyCasePattern } from './case';

export {
  normalizeApostrophes,
  stripDiacritics,
  isIPAChar,
  type TextToken,
  tokenizeIPA,
  tokenizeText,
} from './text';

export {
  getWordFrequency,
  scoreWord,
  sortByFrequency,
  loadFrequencies,
} from '../dictionary/frequency';
