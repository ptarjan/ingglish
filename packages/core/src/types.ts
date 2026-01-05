/**
 * Shared types for @ingglish/core
 */

/**
 * The CMU Pronouncing Dictionary type.
 * Maps lowercase words to their ARPAbet pronunciation strings.
 *
 * @example
 * {
 *   "hello": "HH AH0 L OW1",
 *   "world": "W ER1 L D"
 * }
 */
export type CMUDictionary = Record<string, string>;

/**
 * Configuration options for DOM translation.
 */
export interface DOMTranslatorOptions {
  /**
   * HTML tag names to skip (e.g., ['SCRIPT', 'STYLE', 'CODE']).
   * @default ['SCRIPT', 'STYLE', 'NOSCRIPT', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'CANVAS', 'TEMPLATE', 'TEXTAREA', 'INPUT', 'SELECT']
   */
  skipTags?: string[];

  /**
   * CSS class names to skip.
   */
  skipClasses?: string[];

  /**
   * Whether to translate attributes like title, alt, placeholder.
   * @default false
   */
  translateAttributes?: boolean;

  /**
   * Callback for progress updates during translation.
   */
  onProgress?: (processed: number, total: number) => void;
}
