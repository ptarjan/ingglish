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
  translateDOMAsync,
  restoreDOM,
  skipElement,
  unskipElement,
} from './dom-translator';

// =============================================================================
// DOM Observer (for dynamic content)
// =============================================================================

export { observeAndTranslate } from './dom-observer';

// =============================================================================
// Utilities
// =============================================================================

export {
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  TRANSLATABLE_ATTRIBUTES,
  isBrowser,
  requireBrowser,
  shouldSkipElement,
  shouldSkipTextNode,
} from './dom-utils';
