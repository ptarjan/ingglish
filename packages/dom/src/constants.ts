/**
 * DOM translation constants.
 * Centralizes magic strings used across the package.
 */

// =============================================================================
// CSS Classes
// =============================================================================

/** CSS class for translated word spans (used with tooltips) */
export const WORD_SPAN_CLASS = 'ingglish-word';

/** CSS ID for injected tooltip styles */
export const TOOLTIP_STYLES_ID = 'ingglish-tooltip-styles';

// =============================================================================
// Data Attributes
// =============================================================================

/** Attribute storing original word text on tooltip spans */
export const ATTR_ORIGINAL_WORD = 'data-ingglish-orig';

/** Attribute storing original content on container elements */
export const ATTR_ORIGINAL_CONTENT = 'data-ingglish-original';

/** Attribute to mark elements that should be skipped during translation */
export const ATTR_SKIP = 'data-ingglish-skip';

/** Prefix for storing original attribute values */
export const ATTR_ORIGINAL_PREFIX = 'data-ingglish-original-';

/** CSS class for words that differ between experiment format and standard Ingglish */
export const EXPERIMENT_DIFF_CLASS = 'ingglish-experiment-diff';
