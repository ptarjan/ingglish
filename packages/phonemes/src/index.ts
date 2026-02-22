// Phoneme data and utilities
export {
  ARPABET_VOWELS,
  ARPABET_CONSONANTS,
  STRESS_MARKER_REGEX,
  stripStress,
  isVowel,
  getStress,
} from './arpabet';

// Phonotactics
export { findOnsetStart } from './phonotactics';

// Format registry
export {
  registerFormat,
  getFormatHandler,
  getFormatIsLatinScript,
  getFormatPreservesCase,
  getFormatLabel,
  getFormatNativeLabel,
  getFormatJoinSeparator,
} from './format-registry';
export type { ReverseToken } from './format-registry';

// Conversion maps
export { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from './ingglish-maps';

// Conversion functions
export { arpabetPhonemeToIngglish, arpabetToIngglish, arpabetToFormat } from './to-ingglish';
export { ingglishToArpabet, expandArpabetAlternatives } from './from-ingglish';

// Custom format builder
export { createCustomConverter } from './custom-format';
export type { CustomMappingConfig } from './custom-format';

// Types
export type { OutputFormat } from './types';
