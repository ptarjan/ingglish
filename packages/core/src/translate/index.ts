/**
 * Translation utilities for English <-> Ingglish/IPA.
 */

// Forward translation
export {
  translateWord,
  translateSync,
  translateSyncWithMapping,
  type TranslatedToken,
} from './forward';

// Reverse translation
export {
  reverseTranslateWord,
  reverseTranslateIPAWord,
  reverseTranslateSync,
  ipaToArpabetClean,
} from './reverse';
