/**
 * Core DOM translation functionality.
 */

import { translate, translateSync } from 'ingglish';
import type { OutputFormat, TranslatedToken } from '@ingglish/phonemes';
import { ATTR_ORIGINAL_CONTENT, ATTR_ORIGINAL_PREFIX } from '../constants';
import {
  requireBrowser,
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  TRANSLATABLE_ATTRIBUTES,
  shouldSkipElement,
  collectTextNodes,
  injectTooltipStyles,
  injectTooltipBehavior,
} from '../traversal';
import type { DOMTranslatorOptions } from '../types';
import { processChunked } from './chunked';
import { createTooltipFragment, createTooltipFragmentFromTokens } from './tooltip-fragment';

// Default chunk size for chunked DOM updates
const DEFAULT_CHUNK_SIZE = 100;

/**
 * Translates all text content within a DOM element (async, auto-loads dictionary).
 * This is the recommended entry point for DOM translation.
 */
export async function translateDOM(
  root: Document | Element,
  options: DOMTranslatorOptions = {}
): Promise<void> {
  // Skip English dictionary preload when a custom mapping fn is provided
  if (!options.translateWithMappingFn) {
    await translate('');
  }
  const result = translateDOMSync(root, options as DOMTranslatorOptions & { chunked: true });
  // If chunked mode returns a Promise, await it
  if (result instanceof Promise) {
    await result;
  }
}

/**
 * Translates all text content within a DOM element (sync version).
 * Dictionary must already be loaded via translateDOM() or translate().
 *
 * @param root The root element to translate
 * @param options Configuration options
 * @returns Promise when chunked=true, void otherwise
 */
export function translateDOMSync(
  root: Document | Element,
  options: DOMTranslatorOptions & { chunked: true }
): Promise<void>;
export function translateDOMSync(
  root: Document | Element,
  options?: DOMTranslatorOptions & { chunked?: false }
): void;
export function translateDOMSync(
  root: Document | Element,
  options: DOMTranslatorOptions = {}
): Promise<void> | void {
  requireBrowser();

  const {
    chunked = false,
    chunkSize = DEFAULT_CHUNK_SIZE,
    onProgress,
    outputFormat = 'ingglish',
    showTooltips = false,
    skipClasses = DEFAULT_SKIP_CLASSES,
    skipTags = DEFAULT_SKIP_TAGS,
    translateAttributes = true,
    translateWithMappingFn,
  } = options;

  // Get the document (works for both main document and iframes)
  const targetDoc = root instanceof Document ? root : root.ownerDocument;

  // Inject tooltip CSS and flip behavior if showing tooltips
  if (showTooltips && targetDoc !== null) {
    injectTooltipStyles(targetDoc);
    injectTooltipBehavior(targetDoc);
  }

  // Single walk to collect all text nodes
  const textNodes = collectTextNodes(root, skipTags, skipClasses);
  const totalNodes = textNodes.length;

  // Translate attributes if enabled (do this first, it's fast)
  // Derive a flat string translate function from mapping fn for attributes
  const customTranslateFn = translateWithMappingFn
    ? (text: string, format: OutputFormat) =>
        translateWithMappingFn(text, format)
          .map((t) => t.translated)
          .join('')
    : undefined;

  if (translateAttributes) {
    translateElementAttributes(root, skipTags, skipClasses, outputFormat, customTranslateFn);
  }

  // Chunked mode: use requestAnimationFrame for smooth rendering
  if (chunked) {
    return processChunked(
      textNodes,
      (node) => {
        translateTextNode(
          node,
          showTooltips,
          outputFormat,
          customTranslateFn,
          translateWithMappingFn
        );
      },
      chunkSize,
      onProgress
    );
  }

  // Sync mode: translate all nodes immediately
  for (let i = 0; i < totalNodes; i++) {
    translateTextNode(
      textNodes[i]!,
      showTooltips,
      outputFormat,
      customTranslateFn,
      translateWithMappingFn
    );

    if (onProgress) {
      onProgress(i + 1, totalNodes);
    }
  }
}
/**
 * Translates translatable attributes on elements.
 */
function translateElementAttributes(
  root: Document | Element,
  skipTags: string[],
  skipClasses: string[],
  format: OutputFormat = 'ingglish',
  customTranslateFn?: (text: string, format: OutputFormat) => string
): void {
  const doTranslate =
    customTranslateFn ??
    ((text: string, fmt: OutputFormat) => translateSync(text, { format: fmt }));

  // Only query elements that have translatable attributes (much smaller set than '*')
  const attrSelector = TRANSLATABLE_ATTRIBUTES.map((attr) => `[${attr}]`).join(',');
  const elements = Array.from(root.querySelectorAll<HTMLElement>(attrSelector));

  for (const element of elements) {
    if (shouldSkipElement(element, skipTags, skipClasses)) {
      continue;
    }

    for (const attrName of TRANSLATABLE_ATTRIBUTES) {
      const attrValue = element.getAttribute(attrName);
      if (attrValue !== null && attrValue.length > 0) {
        // Store original attribute value for restoration
        const originalAttrName = `${ATTR_ORIGINAL_PREFIX}${attrName}`;
        if (!element.hasAttribute(originalAttrName)) {
          element.setAttribute(originalAttrName, attrValue);
        }
        element.setAttribute(attrName, doTranslate(attrValue, format));
      }
    }
  }
}

/**
 * Translates a single text node (internal helper).
 */
function translateTextNode(
  textNode: Text,
  showTooltips: boolean,
  outputFormat: OutputFormat,
  customTranslateFn?: (text: string, format: OutputFormat) => string,
  customMappingFn?: (text: string, format: OutputFormat) => TranslatedToken[]
): void {
  const originalText = textNode.textContent;
  if (!originalText) {
    return;
  }

  const parent = textNode.parentElement;

  if (showTooltips) {
    // Replace text node with tooltip spans
    const fragment = customMappingFn
      ? createTooltipFragmentFromTokens(customMappingFn(originalText, outputFormat))
      : createTooltipFragment(originalText, outputFormat);
    // Store original text on parent for restoration
    if (parent && !parent.hasAttribute(ATTR_ORIGINAL_CONTENT)) {
      parent.setAttribute(ATTR_ORIGINAL_CONTENT, originalText);
    }
    textNode.replaceWith(fragment);
  } else {
    // Simple text replacement (original behavior)
    if (parent && !parent.hasAttribute(ATTR_ORIGINAL_CONTENT)) {
      parent.setAttribute(ATTR_ORIGINAL_CONTENT, originalText);
    }
    const doTranslate =
      customTranslateFn ??
      ((text: string, fmt: OutputFormat) => translateSync(text, { format: fmt }));
    textNode.textContent = doTranslate(originalText, outputFormat);
  }
}
