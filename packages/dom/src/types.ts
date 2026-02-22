/**
 * Shared types for @ingglish/dom
 */
import type { OutputFormat } from '@ingglish/phonemes';

/**
 * Configuration options for DOM translation.
 */
export interface DOMTranslatorOptions {
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
   * Whether to show tooltips with original English words on hover.
   * When enabled, translated words are wrapped in spans with data-original attributes.
   * @default false
   */
  showTooltips?: boolean;

  /**
   * CSS class names to skip during translation.
   * @default ['no-translate', 'notranslate']
   */
  skipClasses?: string[];

  /**
   * HTML tag names to skip during translation.
   * @default ['SCRIPT', 'STYLE', 'CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SVG', 'MATH', 'CANVAS']
   */
  skipTags?: string[];

  /**
   * Whether to translate attributes like title, alt, placeholder, aria-label.
   * @default true
   */
  translateAttributes?: boolean;
}
