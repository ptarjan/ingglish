/**
 * Internal utilities shared with @ingglish/dom.
 * Not part of the public API - may change without notice.
 *
 * @internal
 */

// Text utilities
export {
  normalizeApostrophes,
  isIPAChar,
  isPhoneticChar,
  tokenizeIPA,
  tokenizeText,
  tokenizePhonetic,
} from './utils/text';
export type { TextToken, IndexedToken } from './utils/text';

// Case utilities
export { detectCasePattern, applyCasePattern } from './utils/case';
export type { CasePattern } from './utils/case';

// Phoneme conversion (for spelling guide)
export { arpabetPhonemeToIngglish, arpabetPhonemeToIPA } from './convert';

// Word-level translation (advanced use)
export { translateWord } from './translate/forward';
export { reverseTranslateWord, reverseTranslateIPAWord } from './translate/reverse';
