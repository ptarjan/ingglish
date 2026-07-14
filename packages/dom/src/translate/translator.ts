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
import { rememberOriginalText } from './original-text';
import { createTooltipFragment, createTooltipFragmentFromTokens } from './tooltip-fragment';

// Default chunk size for chunked DOM updates
const DEFAULT_CHUNK_SIZE = 100;

/** Internal context passed to translation helpers. */
interface TranslateContext {
  doTranslate: (text: string, format: OutputFormat) => string;
  mappingFn?: (text: string, format: OutputFormat) => TranslatedToken[];
  outputFormat: OutputFormat;
  showTooltips: boolean;
  skipClasses: string[];
  skipTags: string[];
}

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

  // Build shared context for translation helpers
  const ctx: TranslateContext = {
    doTranslate: translateWithMappingFn
      ? (text, format) =>
          translateWithMappingFn(text, format)
            .map((t) => t.translated)
            .join('')
      : (text, fmt) => translateSync(text, { format: fmt }),
    mappingFn: translateWithMappingFn,
    outputFormat,
    showTooltips,
    skipClasses,
    skipTags,
  };

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
    translateElementAttributes(root, ctx);
  }

  // Chunked mode: use requestAnimationFrame for smooth rendering
  if (chunked) {
    return processChunked(
      textNodes,
      (node) => {
        translateTextNode(node, ctx);
      },
      chunkSize,
      onProgress
    );
  }

  // Sync mode: translate all nodes immediately
  for (let i = 0; i < totalNodes; i++) {
    translateTextNode(textNodes[i]!, ctx);

    if (onProgress) {
      onProgress(i + 1, totalNodes);
    }
  }
}
/**
 * Translates translatable attributes on elements.
 */
function translateElementAttributes(root: Document | Element, ctx: TranslateContext): void {
  // Only query elements that have translatable attributes (much smaller set than '*')
  const attrSelector = TRANSLATABLE_ATTRIBUTES.map((attr) => `[${attr}]`).join(',');
  const elements = Array.from(root.querySelectorAll<HTMLElement>(attrSelector));

  for (const element of elements) {
    if (shouldSkipElement(element, ctx.skipTags, ctx.skipClasses)) {
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
        element.setAttribute(attrName, ctx.doTranslate(attrValue, ctx.outputFormat));
      }
    }
  }
}

/**
 * Translates a single text node (internal helper).
 */
function translateTextNode(textNode: Text, ctx: TranslateContext): void {
  const originalText = textNode.textContent;
  if (!originalText) {
    /* v8 ignore start */
    return;
    /* v8 ignore stop */
  }

  const parent = textNode.parentElement;

  // Store original text on parent for restoration
  if (parent && !parent.hasAttribute(ATTR_ORIGINAL_CONTENT)) {
    parent.setAttribute(ATTR_ORIGINAL_CONTENT, originalText);
  }

  if (ctx.showTooltips) {
    // Replace text node with tooltip spans
    const fragment = ctx.mappingFn
      ? createTooltipFragmentFromTokens(ctx.mappingFn(originalText, ctx.outputFormat))
      : createTooltipFragment(originalText, ctx.outputFormat);
    textNode.replaceWith(fragment);
  } else {
    // Simple text replacement
    rememberOriginalText(textNode, originalText);
    textNode.textContent = ctx.doTranslate(originalText, ctx.outputFormat);
  }
}
