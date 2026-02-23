// Phoneme data and utilities
export {
  ARPABET_CONSONANTS,
  ARPABET_VOWELS,
  getStress,
  isConsonant,
  isVowel,
  STRESS_MARKER_REGEX,
  stripStress,
} from './arpabet';

// Custom format builder
export { createCustomConverter } from './custom-format';

export type { CustomMappingConfig } from './custom-format';

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

export type { ReverseToken } from './format-registry';

// Conversion functions
export { expandArpabetAlternatives, ingglishToArpabet } from './from-ingglish';

// Conversion maps
export { ARPABET_TO_INGGLISH_MAP, R_COLORED_FORWARD } from './ingglish-maps';

// Phonotactics
export { findOnsetStart } from './phonotactics';

// Conversion functions
export { arpabetPhonemeToIngglish, arpabetToFormat, arpabetToIngglish } from './to-ingglish';
export type { FormatOptions } from './to-ingglish';

// Types
export type { OutputFormat } from './types';
