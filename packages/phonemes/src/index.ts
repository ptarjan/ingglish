/* eslint-disable perfectionist/sort-exports */

// Phoneme data & utilities
export { registerPronunciation } from './to-pronunciation';
export {
  ARPABET_CONSONANTS,
  ARPABET_VOWELS,
  getStress,
  isVowel,
  STRESS_MARKER_REGEX,
  stripStress,
} from './arpabet';

// Phonotactics
export { findOnsetStart } from './phonotactics';

// Format registry
export {
  getFormatHandler,
  getFormatIsLatinScript,
  getFormatJoinSeparator,
  getFormatLabel,
  getFormatNativeLabel,
  getFormatPreservesCase,
  registerFormat,
} from './format-registry';

// Forward conversion (ARPAbet → display formats)
export { arpabetPhonemeToIngglish, arpabetToFormat, arpabetToIngglish } from './to-ingglish';

// Reverse conversion (display formats → ARPAbet)
export { expandArpabetAlternatives, ingglishToArpabet } from './from-ingglish';

// Conversion maps
export { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from './ingglish-maps';

// Custom format builder
export { createCustomConverter } from './custom-format';

// Reverse translation factory for Unicode scripts
export { createScriptReverseTranslator } from './reverse-factory';

// Test utilities
export { verifyScriptRoundTrip } from './verify-script-roundtrip';

// Types
export type { CustomMappingConfig } from './custom-format';
export type { ScriptReverseTranslator } from './reverse-factory';
export type { OutputFormat } from './types';
export type { TranslatedToken } from './translated-token';
