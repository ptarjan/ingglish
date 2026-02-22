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

export { translateDOM, restoreDOM, applyTranslationsMap } from './translate';

export {
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  collectTextNodes,
  extractWordsFromNodes,
  injectTooltipStyles,
  injectTooltipBehavior,
} from './traversal';
