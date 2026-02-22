export { applyCasePattern, detectCasePattern, splitCamelCase } from './case';
export type { CasePattern } from './case';

export {
  extractPreservedPatterns,
  normalizeApostrophes,
  restorePreservedPatterns,
  stripDiacritics,
} from './text';

export {
  isIPAChar,
  isPhoneticChar,
  tokenizeIPA,
  tokenizePhonetic,
  tokenizeText,
  WORD_SPLIT_REGEX,
  WORD_TEST_REGEX,
} from './tokenize';
export type { IndexedToken, TextToken } from './tokenize';
