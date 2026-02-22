/**
 * Translation utilities for English <-> Ingglish/IPA.
 */

// Forward translation
export {
  type TranslatedToken,
  translateSync,
  translateSyncWithMapping,
  translateWord,
} from './forward';

// Reverse translation
export {
  reverseTranslateSync,
  reverseTranslateSyncWithMapping,
  reverseTranslateWord,
} from './reverse';
