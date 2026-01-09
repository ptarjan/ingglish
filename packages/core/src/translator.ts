/**
 * Translator module - re-exports from new locations for backwards compatibility.
 * @deprecated Import from './dictionary' and './translate' instead.
 */

// Dictionary exports
export {
  loadDictionary,
  getDictionary,
  isDictionaryLoaded,
  lookupPronunciation,
} from './dictionary';

// Text utilities
export { normalizeApostrophes } from './utils/text';

// Translation exports
export { translateWord, translateSync, translateSyncWithMapping } from './translate/forward';
