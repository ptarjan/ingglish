/**
 * ARPAbet to IPA conversion - re-exports from new location for backwards compatibility.
 * @deprecated Import from './convert' instead.
 */

export { IPA_VOWEL_MAP, IPA_CONSONANT_MAP } from './convert/ipa-maps';

export { arpabetPhonemeToIPA, arpabetToIPA, arpabetToIPARaw } from './convert/to-ipa';

// Re-export phonotactics for compatibility with any code that imports from here
export { VALID_ONSETS, isValidOnset, findOnsetStart } from './phonemes/phonotactics';
