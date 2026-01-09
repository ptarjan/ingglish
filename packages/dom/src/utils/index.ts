/**
 * DOM translation utilities.
 */

// Browser checks
export { isBrowser, requireBrowser } from './browser';

// Skip rules
export {
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  TRANSLATABLE_ATTRIBUTES,
  shouldSkipElement,
  shouldSkipTextNode,
  skipElement,
  unskipElement,
} from './skip-rules';

// Text node collection
export { collectTextNodes } from './text-nodes';

// Text processing
export { normalizeApostrophes } from './text';

// Word extraction
export { extractWords, extractWordsFromNodes } from './extract';

// Case transformation
export { applyCase } from './case';

// Tooltip styles
export { TOOLTIP_STYLES, injectTooltipStyles } from './tooltip';
