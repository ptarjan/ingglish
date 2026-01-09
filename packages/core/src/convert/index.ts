/**
 * Conversion utilities between ARPAbet, IPA, and Ingglish.
 */

// Phoneme maps
export {
  INGGLISH_VOWEL_MAP,
  INGGLISH_CONSONANT_MAP,
  ARPABET_TO_INGGLISH_MAP,
  INGGLISH_TO_ARPABET_MAP,
} from './ingglish-maps';

export {
  IPA_VOWEL_MAP,
  IPA_CONSONANT_MAP,
  ARPABET_TO_IPA_MAP,
  IPA_TO_ARPABET_MAP,
} from './ipa-maps';

// ARPAbet to output formats
export { arpabetPhonemeToIngglish, arpabetToIngglish, arpabetToFormat } from './to-ingglish';

export { arpabetPhonemeToIPA, arpabetToIPA, arpabetToIPARaw } from './to-ipa';

// Input formats to ARPAbet
export { ingglishToArpabet } from './from-ingglish';

export { ipaToArpabet, ipaToArpabetString } from './from-ipa';
