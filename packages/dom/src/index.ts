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

// =============================================================================
// Types
// =============================================================================

export type { DOMTranslatorOptions, OutputFormat } from './types';

// =============================================================================
// DOM Translation
// =============================================================================

export {
  translateDOM,
  translateDOMSync,
  restoreDOM,
  applyTranslationsMap,
  type ApplyTranslationsOptions,
} from './translate';

export { skipElement, unskipElement } from './utils';

// =============================================================================
// DOM Observer (for dynamic content)
// =============================================================================

export { observeAndTranslate } from './observe';

// =============================================================================
// Utilities
// =============================================================================

export {
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  TRANSLATABLE_ATTRIBUTES,
  TOOLTIP_STYLES,
  isBrowser,
  requireBrowser,
  shouldSkipElement,
  shouldSkipTextNode,
  collectTextNodes,
  extractWords,
  extractWordsFromNodes,
  normalizeApostrophes,
  applyCase,
  injectTooltipStyles,
} from './utils';
