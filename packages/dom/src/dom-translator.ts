/**
 * DOM translator - re-exports from new locations for backwards compatibility.
 * @deprecated Import from './translate' instead.
 */

export type { DOMTranslatorOptions } from './types';
export { skipElement, unskipElement } from './utils';

export {
  translateDOM,
  translateDOMSync,
  restoreDOM,
  applyTranslationsMap,
  type ApplyTranslationsOptions,
} from './translate';
