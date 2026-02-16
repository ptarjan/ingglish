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
export {
  IPA_VOWEL_MAP,
  IPA_CONSONANT_MAP,
  ARPABET_TO_IPA_MAP,
  IPA_VARIANT_MAP,
  IPA_TO_ARPABET_MAP,
} from './ipa-maps';

// Conversion functions
export { arpabetPhonemeToIngglish, arpabetToIngglish, arpabetToFormat } from './to-ingglish';
export { arpabetPhonemeToIPA, arpabetToIPA, arpabetToIPARaw } from './to-ipa';
export { ingglishToArpabet, expandArpabetAlternatives } from './from-ingglish';
export { ipaToArpabet, ipaToArpabetClean, ipaToArpabetString } from './from-ipa';

// Types
export type { OutputFormat } from './types';
