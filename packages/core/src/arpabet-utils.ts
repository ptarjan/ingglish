/**
 * ARPAbet utilities - re-exports from new location for backwards compatibility.
 * @deprecated Import from './phonemes' instead.
 */

export {
  ARPABET_VOWELS,
  ARPABET_CONSONANTS,
  stripStress,
  isVowel,
  isConsonant,
  getStress,
} from './phonemes/arpabet';
