/**
 * Internal utilities shared between packages in this monorepo.
 * Not part of the public API - may change without notice.
 *
 * NOTE: This file exports utilities needed by @ingglish/dom, @ingglish/website,
 * and @ingglish/extension. It is NOT for external consumers of @ingglish/core.
 * Functions only used within core (like ipaToArpabetClean) belong in their
 * respective modules, not here.
 *
 * @internal
 */

// Text utilities
export {
  normalizeApostrophes,
  stripDiacritics,
  isIPAChar,
  isPhoneticChar,
  tokenizeIPA,
  tokenizeText,
  tokenizePhonetic,
  WORD_SPLIT_REGEX,
  WORD_TEST_REGEX,
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

// Dictionary loading (for test setup)
export { loadDictionary, isDictionaryLoaded } from './dictionary/loader';
export { loadReverseDictionary } from './dictionary/reverse';
export { loadFrequencies } from './dictionary/frequency';
