/**
 * @ingglish/dom - DOM Translation Utilities
 *
 * @example
 * ```typescript
 * import { translateDOM } from '@ingglish/dom';
 *
 * await translateDOM(document.body, { showTooltips: true });
 * ```
 */

export { applyTranslationsMap, restoreDOM, translateDOM } from './translate';

export {
  collectTextNodes,
  DEFAULT_SKIP_CLASSES,
  DEFAULT_SKIP_TAGS,
  extractWordsFromNodes,
  injectTooltipBehavior,
  injectTooltipStyles,
} from './traversal';

export type { DOMTranslatorOptions } from './types';
