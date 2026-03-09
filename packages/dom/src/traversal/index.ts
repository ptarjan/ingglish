/* v8 ignore start */
/**
 * DOM translation utilities.
 */

// Browser checks
export { isBrowser, requireBrowser } from './browser';

// Word extraction
export { extractWords, extractWordsFromNodes } from './extract';

// Skip rules
export {
  DEFAULT_SKIP_CLASSES,
  DEFAULT_SKIP_TAGS,
  shouldSkipElement,
  shouldSkipTextNode,
  skipElement,
  TRANSLATABLE_ATTRIBUTES,
  unskipElement,
} from './skip-rules';

// Text node collection
export { collectTextNodes } from './text-nodes';

// Tooltip styles
export { injectTooltipBehavior, injectTooltipStyles, TOOLTIP_STYLES } from './tooltip';
/* v8 ignore stop */
