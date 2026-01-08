/**
 * Core DOM translation functionality.
 */
import {
  translateText,
  translateTextWithMapping,
  loadDictionary,
  isDictionaryLoaded,
} from './translator';
import type { DOMTranslatorOptions } from './types';
import {
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  TRANSLATABLE_ATTRIBUTES,
  requireBrowser,
  shouldSkipElement,
} from './dom-utils';

// Re-export types and utilities for convenience
export type { DOMTranslatorOptions };
export { skipElement, unskipElement } from './dom-utils';

/**
 * Creates a document fragment with tooltip spans for each translated word.
 * Words get wrapped in spans with data-original attributes for CSS tooltips.
 * Non-word tokens (punctuation, whitespace) are added as text nodes.
 */
function createTooltipFragment(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const tokens = translateTextWithMapping(text);

  for (const token of tokens) {
    if (token.isWord && token.original !== token.translated) {
      // Word that was translated - wrap in tooltip span
      // data-ingglish-orig stores original text AND marks as translated (prevents re-processing)
      const span = document.createElement('span');
      span.className = 'ingglish-word';
      span.setAttribute('data-ingglish-orig', token.original);
      span.textContent = token.translated;
      fragment.appendChild(span);
    } else {
      // Non-word or unchanged - just add as text
      fragment.appendChild(document.createTextNode(token.translated));
    }
  }

  return fragment;
}

/**
 * Collects all translatable text nodes in a single DOM walk.
 * Returns nodes that should be translated (non-empty, not in skipped elements).
 */
function collectTextNodes(
  root: Element | Document,
  skipTags: string[],
  skipClasses: string[]
): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Text): number {
      // Skip empty or whitespace-only text
      const text = node.textContent?.trim() ?? '';
      if (text.length === 0) {
        return NodeFilter.FILTER_SKIP;
      }

      // Check parent elements for skip conditions
      let parent = node.parentElement;
      while (parent) {
        if (shouldSkipElement(parent, skipTags, skipClasses)) {
          return NodeFilter.FILTER_SKIP;
        }
        parent = parent.parentElement;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  return textNodes;
}

/**
 * Translates all text content within a DOM element.
 * Uses a single DOM walk to collect and then translate text nodes.
 *
 * @param root The root element to translate
 * @param options Configuration options
 */
export function translateDOM(root: Element | Document, options: DOMTranslatorOptions = {}): void {
  requireBrowser();

  if (!isDictionaryLoaded()) {
    throw new Error('Dictionary not loaded. Call loadDictionary() first.');
  }

  const {
    skipTags = DEFAULT_SKIP_TAGS,
    skipClasses = DEFAULT_SKIP_CLASSES,
    translateAttributes = true,
    showTooltips = false,
    onProgress,
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

  // Translate each text node
  for (let i = 0; i < textNodes.length; i++) {
    const textNode = textNodes[i];
    const originalText = textNode.textContent;
    if (originalText) {
      const parent = textNode.parentElement;

      if (showTooltips) {
        // Replace text node with tooltip spans
        const fragment = createTooltipFragment(originalText);
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
        textNode.textContent = translateText(originalText);
      }
    }

    if (onProgress && totalNodes > 0) {
      onProgress(i + 1, totalNodes);
    }
  }

  // Translate attributes if enabled
  if (translateAttributes) {
    translateElementAttributes(root, skipTags, skipClasses);
  }
}

/**
 * CSS styles for tooltip functionality.
 * Injected once into the document when tooltips are enabled.
 */
const TOOLTIP_STYLES = `
.ingglish-word {
  position: relative;
  cursor: help;
}

.ingglish-word:hover::after {
  content: attr(data-ingglish-orig);
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  z-index: 10000;
  pointer-events: none;
  opacity: 0;
  animation: ingglish-tooltip-fade-in 0.15s ease-out forwards;
}

.ingglish-word:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #333;
  margin-bottom: -10px;
  z-index: 10000;
  pointer-events: none;
  opacity: 0;
  animation: ingglish-tooltip-fade-in 0.15s ease-out forwards;
}

@keyframes ingglish-tooltip-fade-in {
  to { opacity: 1; }
}
`;

// Track which documents have had tooltip styles injected (supports iframes)
const injectedDocuments = new WeakSet<Document>();

/**
 * Injects the tooltip CSS styles into the document head.
 * Handles both main document and iframe documents.
 */
function injectTooltipStyles(targetDoc: Document): void {
  if (injectedDocuments.has(targetDoc)) {
    return;
  }

  const style = targetDoc.createElement('style');
  style.id = 'ingglish-tooltip-styles';
  style.textContent = TOOLTIP_STYLES;
  targetDoc.head.appendChild(style);
  injectedDocuments.add(targetDoc);
}

/**
 * Translates translatable attributes on elements.
 */
function translateElementAttributes(
  root: Element | Document,
  skipTags: string[],
  skipClasses: string[]
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
        element.setAttribute(attrName, translateText(attrValue));
      }
    }
  }
}

/**
 * Async version that loads the dictionary first.
 */
export async function translateDOMAsync(
  root: Element | Document,
  options: DOMTranslatorOptions = {}
): Promise<void> {
  await loadDictionary();
  translateDOM(root, options);
}

/**
 * Restores original text content that was translated.
 * Uses the data-ingglish-original attributes stored during translation.
 *
 * @param root The root element to restore
 */
export function restoreDOM(root: Element | Document): void {
  requireBrowser();

  // Restore text content
  const elementsWithOriginal = Array.from(root.querySelectorAll('[data-ingglish-original]'));

  for (const element of elementsWithOriginal) {
    const originalText = element.getAttribute('data-ingglish-original');
    if (originalText !== null) {
      // Find the text node child and restore it
      for (const child of Array.from(element.childNodes)) {
        if (child.nodeType === Node.TEXT_NODE) {
          child.textContent = originalText;
          break;
        }
      }
      element.removeAttribute('data-ingglish-original');
    }
  }

  // Restore attributes
  for (const attrName of TRANSLATABLE_ATTRIBUTES) {
    const originalAttrName = `data-ingglish-original-${attrName}`;
    const elementsWithAttr = Array.from(root.querySelectorAll(`[${originalAttrName}]`));

    for (const element of elementsWithAttr) {
      const originalValue = element.getAttribute(originalAttrName);
      if (originalValue !== null) {
        element.setAttribute(attrName, originalValue);
        element.removeAttribute(originalAttrName);
      }
    }
  }
}
