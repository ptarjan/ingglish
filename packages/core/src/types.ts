/**
 * Shared types for @ingglish/core
 */

/**
 * Output format for translations.
 * - 'ingglish': Phonetic English spelling (e.g., "Hulo werld")
 * - 'ipa': International Phonetic Alphabet (e.g., "/həlˈoʊ wˈɝld/")
 */
export type OutputFormat = 'ingglish' | 'ipa';

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
   * HTML tag names to skip during translation.
   * @default ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SVG', 'MATH', 'CANVAS']
   */
  skipTags?: string[];

  /**
   * CSS class names to skip during translation.
   * @default ['no-translate', 'notranslate']
   */
  skipClasses?: string[];

  /**
   * Whether to translate attributes like title, alt, placeholder, aria-label.
   * @default true
   */
  translateAttributes?: boolean;

  /**
   * Whether to show tooltips with original English words on hover.
   * When enabled, translated words are wrapped in spans with data-original attributes.
   * @default false
   */
  showTooltips?: boolean;

  /**
   * Callback for progress updates during translation.
   */
  onProgress?: (processed: number, total: number) => void;

  /**
   * Output format for translations.
   * @default 'ingglish'
   */
  outputFormat?: OutputFormat;

  /**
   * Enable chunked DOM updates using requestAnimationFrame for smooth rendering.
   * Prevents UI freezes on large pages.
   * @default false
   */
  chunked?: boolean;

  /**
   * Number of text nodes to process per animation frame when chunked is enabled.
   * @default 100
   */
  chunkSize?: number;
}
