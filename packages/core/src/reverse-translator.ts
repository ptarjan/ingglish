/**
 * Reverse translator module - re-exports from new locations for backwards compatibility.
 * @deprecated Import from './translate' and './detect' instead.
 */

// Re-export from translate/reverse.ts
export {
  reverseTranslateWord,
  reverseTranslateIPAWord,
  reverseTranslateSync,
  ipaToArpabetClean,
} from './translate/reverse';

// Re-export from dictionary/reverse.ts
export { warmReverseDictionaryCache } from './dictionary/reverse';

// Re-export from detect/language.ts
export { isLikelyIngglish } from './detect/language';
