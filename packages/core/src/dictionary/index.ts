/**
 * CMU Dictionary utilities.
 */

export { loadDictionary, getDictionary, isDictionaryLoaded } from './loader';

export { lookupPronunciation, hasWord } from './lookup';

export {
  loadReverseDictionary,
  getReverseDictionary,
  lookupPhonemeKey,
  clearReverseDictionaryCache,
} from './reverse';
