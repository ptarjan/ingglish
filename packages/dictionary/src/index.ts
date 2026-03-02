export {
  CUSTOM_PRONUNCIATIONS,
  getCustomPronunciation,
  hasCustomPronunciation,
} from './custom-words';
export { getCorpusTotal, getWordFrequency, loadFrequencies, sortByFrequency } from './frequency';
export { getDictionary, isDictionaryLoaded, loadDictionary, setDictionaryLoader } from './loader';
export { lookupPronunciation, lookupPronunciationLower } from './lookup';
export { loadReverseDictionary, lookupPhonemeKey } from './reverse';
