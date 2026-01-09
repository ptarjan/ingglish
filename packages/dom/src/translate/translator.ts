/**
 * Core DOM translation functionality.
 */

import { translate, translateSync } from '@ingglish/core';
import type { DOMTranslatorOptions, OutputFormat } from '../types';
import {
  requireBrowser,
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  TRANSLATABLE_ATTRIBUTES,
  shouldSkipElement,
  collectTextNodes,
  injectTooltipStyles,
} from '../utils';
import { createTooltipFragment } from './tooltip-fragment';

// Default chunk size for chunked DOM updates
const DEFAULT_CHUNK_SIZE = 100;

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
    if (parent && !parent.hasAttribute('data-ingglish-original')) {
      parent.setAttribute('data-ingglish-original', originalText);
    }
    textNode.replaceWith(fragment);
  } else {
    // Simple text replacement (original behavior)
    if (parent && !parent.hasAttribute('data-ingglish-original')) {
      parent.setAttribute('data-ingglish-original', originalText);
    }
    textNode.textContent = translateSync(originalText, outputFormat);
  }
}

/**
 * Processes text nodes in chunks using requestAnimationFrame for smooth rendering.
 */
function translateNodesChunked(
  textNodes: Text[],
  showTooltips: boolean,
  outputFormat: OutputFormat,
  chunkSize: number,
  onProgress?: (processed: number, total: number) => void
): Promise<void> {
  return new Promise((resolve) => {
    const totalNodes = textNodes.length;
    let index = 0;

    function processChunk(): void {
      const endIndex = Math.min(index + chunkSize, totalNodes);

      // Process this chunk
      while (index < endIndex) {
        translateTextNode(textNodes[index], showTooltips, outputFormat);
        index++;

        if (onProgress && totalNodes > 0) {
          onProgress(index, totalNodes);
        }
      }

      // Schedule next chunk or complete
      if (index < totalNodes) {
        requestAnimationFrame(processChunk);
      } else {
        resolve();
      }
    }

    // Start processing
    if (totalNodes > 0) {
      requestAnimationFrame(processChunk);
    } else {
      resolve();
    }
  });
}

/**
 * Translates translatable attributes on elements.
 */
function translateElementAttributes(
  root: Element | Document,
  skipTags: string[],
  skipClasses: string[],
  format: OutputFormat = 'ingglish'
): void {
  const elements = Array.from(root.querySelectorAll('*'));

  for (const element of elements) {
    if (shouldSkipElement(element, skipTags, skipClasses)) {
      continue;
    }

    for (const attrName of TRANSLATABLE_ATTRIBUTES) {
      const attrValue = element.getAttribute(attrName);
      if (attrValue !== null && attrValue.length > 0) {
        // Store original attribute value for restoration
        const originalAttrName = `data-ingglish-original-${attrName}`;
        if (!element.hasAttribute(originalAttrName)) {
          element.setAttribute(originalAttrName, attrValue);
        }
        element.setAttribute(attrName, translateSync(attrValue, format));
      }
    }
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
  root: Element | Document,
  options: DOMTranslatorOptions & { chunked: true }
): Promise<void>;
export function translateDOMSync(
  root: Element | Document,
  options?: DOMTranslatorOptions & { chunked?: false }
): void;
export function translateDOMSync(
  root: Element | Document,
  options: DOMTranslatorOptions = {}
): void | Promise<void> {
  requireBrowser();

  const {
    skipTags = DEFAULT_SKIP_TAGS,
    skipClasses = DEFAULT_SKIP_CLASSES,
    translateAttributes = true,
    showTooltips = false,
    onProgress,
    outputFormat = 'ingglish',
    chunked = false,
    chunkSize = DEFAULT_CHUNK_SIZE,
  } = options;

  // Get the document (works for both main document and iframes)
  const targetDoc = root instanceof Document ? root : root.ownerDocument;

  // Inject tooltip CSS if showing tooltips
  if (showTooltips && targetDoc !== null) {
    injectTooltipStyles(targetDoc);
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
    return translateNodesChunked(textNodes, showTooltips, outputFormat, chunkSize, onProgress);
  }

  // Sync mode: translate all nodes immediately
  for (let i = 0; i < totalNodes; i++) {
    translateTextNode(textNodes[i], showTooltips, outputFormat);

    if (onProgress && totalNodes > 0) {
      onProgress(i + 1, totalNodes);
    }
  }
}

/**
 * Translates all text content within a DOM element (async, auto-loads dictionary).
 * This is the recommended entry point for DOM translation.
 */
export async function translateDOM(
  root: Element | Document,
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
