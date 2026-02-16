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
// Constants
// =============================================================================

export {
  WORD_SPAN_CLASS,
  TOOLTIP_STYLES_ID,
  ATTR_ORIGINAL_WORD,
  ATTR_ORIGINAL_CONTENT,
  ATTR_SKIP,
  ATTR_ORIGINAL_PREFIX,
} from './constants';

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
  collectTextNodes,
  extractWordsFromNodes,
  injectTooltipStyles,
  injectTooltipBehavior,
} from './utils';
