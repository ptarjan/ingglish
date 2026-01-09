/**
 * CMU Dictionary utilities.
 */

export { loadDictionary, getDictionary, isDictionaryLoaded } from './loader';

export { lookupPronunciation, hasWord } from './lookup';

export {
  warmReverseDictionaryCache,
  lookupPhonemeKey,
  clearReverseDictionaryCache,
} from './reverse';
