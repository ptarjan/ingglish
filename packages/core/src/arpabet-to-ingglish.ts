/**
 * ARPAbet to Ingglish conversion - re-exports from new location for backwards compatibility.
 * @deprecated Import from './convert' instead.
 */

export { stripStress } from './phonemes/arpabet';

export {
  INGGLISH_VOWEL_MAP as VOWEL_MAP,
  INGGLISH_CONSONANT_MAP as CONSONANT_MAP,
  ARPABET_TO_INGGLISH_MAP as ARPABET_MAP,
} from './convert/ingglish-maps';

export {
  arpabetPhonemeToIngglish,
  arpabetToIngglish,
  arpabetToFormat,
} from './convert/to-ingglish';
