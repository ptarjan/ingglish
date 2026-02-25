/**
 * Core DOM translation functionality.
 */

import { translate, translateSync } from 'ingglish';
import type { OutputFormat } from '@ingglish/phonemes';
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
import { createTooltipFragment } from './tooltip-fragment';

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
  // Ensure dictionary is loaded by calling translate
  await translate('');
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
  if (translateAttributes) {
    translateElementAttributes(root, skipTags, skipClasses, outputFormat);
  }

  // Chunked mode: use requestAnimationFrame for smooth rendering
  if (chunked) {
    return processChunked(
      textNodes,
      (node) => {
        translateTextNode(node, showTooltips, outputFormat);
      },
      chunkSize,
      onProgress
    );
  }

  // Sync mode: translate all nodes immediately
  for (let i = 0; i < totalNodes; i++) {
    translateTextNode(textNodes[i]!, showTooltips, outputFormat);

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
  format: OutputFormat = 'ingglish'
): void {
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
        element.setAttribute(attrName, translateSync(attrValue, format));
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
  outputFormat: OutputFormat
): void {
  const originalText = textNode.textContent;
  if (!originalText) {
    return;
  }

  const parent = textNode.parentElement;

  if (showTooltips) {
    // Replace text node with tooltip spans
    const fragment = createTooltipFragment(originalText, outputFormat);
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
    textNode.textContent = translateSync(originalText, outputFormat);
  }
}
