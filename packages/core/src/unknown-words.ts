/**
 * Unknown words handling - re-exports from new location for backwards compatibility.
 * @deprecated Import from './fallback' instead.
 */

export {
  // Custom words
  CUSTOM_PRONUNCIATIONS,
  hasCustomPronunciation,
  getCustomPronunciation,
  // Acronyms
  LETTER_PHONEMES,
  KNOWN_INITIALISMS,
  isInitialism,
  translateAsAcronym,
  // Compounds
  translateAsCompound,
  // Stemming
  SUFFIX_PHONEMES,
  PREFIX_PHONEMES,
  translateWithStemming,
  // Phonemize
  translateWithPhonemize,
  preloadPhonemize,
  // G2P rules
  GRAPHEME_TO_PHONEME,
  wordToArpabet,
  translateWithRules,
  // Main function
  translateUnknown,
} from './fallback';
