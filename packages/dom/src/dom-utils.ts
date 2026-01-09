/**
 * DOM utilities - re-exports from new locations for backwards compatibility.
 * @deprecated Import from './utils' instead.
 */

export {
  // Browser checks
  isBrowser,
  requireBrowser,
  // Skip rules
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  TRANSLATABLE_ATTRIBUTES,
  shouldSkipElement,
  shouldSkipTextNode,
  skipElement,
  unskipElement,
  // Text node collection
  collectTextNodes,
  // Text processing
  normalizeApostrophes,
  // Word extraction
  extractWords,
  extractWordsFromNodes,
  // Case transformation
  applyCase,
  // Tooltip styles
  TOOLTIP_STYLES,
  injectTooltipStyles,
} from './utils';
