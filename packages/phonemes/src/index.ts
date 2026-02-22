// Phoneme data and utilities
export {
  ARPABET_VOWELS,
  ARPABET_CONSONANTS,
  STRESS_MARKER_REGEX,
  stripStress,
  isVowel,
  isConsonant,
  getStress,
} from './arpabet';

// Phonotactics
export { VALID_ONSETS, isValidOnset, findOnsetStart } from './phonotactics';

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
export type { FormatHandler, ReverseToken } from './format-registry';

// Conversion maps
export {
  INGGLISH_VOWEL_MAP,
  INGGLISH_CONSONANT_MAP,
  ARPABET_TO_INGGLISH_MAP,
  INGGLISH_TO_ARPABET_MAP,
  R_COLORED_VOWELS,
  R_COLORED_FORWARD,
  R_COLORED_REVERSE_3CHAR,
  R_COLORED_REVERSE_2CHAR,
} from './ingglish-maps';

// Conversion functions
export {
  arpabetPhonemeToIngglish,
  arpabetToIngglish,
  arpabetToFormat,
  convertArpabet,
} from './to-ingglish';
export { ingglishToArpabet, expandArpabetAlternatives } from './from-ingglish';

// Custom format builder
export { createCustomConverter } from './custom-format';
export type { CustomMappingConfig } from './custom-format';

// Types
export type { OutputFormat } from './types';
