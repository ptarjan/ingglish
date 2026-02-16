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
  reverseTranslateSyncWithMapping,
} from './reverse';

// Re-export ipaToArpabetClean (from @ingglish/ipa, kept here for API compatibility)
export { ipaToArpabetClean } from '@ingglish/ipa';
