// Core translation functions
export {
  loadDictionary,
  getDictionary,
  isDictionaryLoaded,
  lookupPronunciation,
  translateWord,
  translateText,
  translateWordAsync,
  translateTextAsync,
  getDictionaryStats,
} from './translator';

// Phoneme mapping
export {
  PHONEME_MAP,
  VOWEL_MAP,
  CONSONANT_MAP,
  stripStress,
  phonemesToInglish,
} from './phoneme-map';

// Unknown word handling
export {
  translateWithStemming,
  translateWithRules,
  translateUnknown,
  wordToPhonemes,
} from './unknown-words';

// DOM translation
export {
  translateDOM,
  translateDOMAsync,
  observeAndTranslate,
  skipElement,
  unskipElement,
  type DOMTranslatorOptions,
} from './dom-translator';

// Reverse translation (Ingglish -> English)
export {
  inglishToPhonemes,
  reverseTranslateWord,
  reverseTranslateText,
  isLikelyInglish,
} from './reverse-translator';
