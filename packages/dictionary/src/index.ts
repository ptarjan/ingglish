export { loadDictionary, getDictionary, isDictionaryLoaded } from './loader';
export { lookupPronunciation, hasWord } from './lookup';
export {
  loadReverseDictionary,
  getReverseDictionary,
  lookupPhonemeKey,
  clearReverseDictionaryCache,
} from './reverse';
export {
  loadFrequencies,
  loadFrequencies as loadWordFrequencies,
  getWordFrequency,
  scoreWord,
  sortByFrequency,
} from './frequency';
export {
  CUSTOM_PRONUNCIATIONS,
  hasCustomPronunciation,
  getCustomPronunciation,
} from './custom-words';
export type { CMUDictionary, ReverseDictionary } from './types';
