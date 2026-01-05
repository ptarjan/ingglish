import { translateText, loadDictionary, isDictionaryLoaded } from './translator';
import type { DOMTranslatorOptions } from './types';

export type { DOMTranslatorOptions };

/**
 * Checks if we're in a browser environment.
 */
function isBrowser(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

/**
 * Throws an error if not in a browser environment.
 */
function requireBrowser(): void {
  if (!isBrowser()) {
    throw new Error('DOM translation requires a browser environment');
  }
}

/**
 * Default tags to skip during translation.
 * These typically contain code, scripts, or non-translatable content.
 */
const DEFAULT_SKIP_TAGS = [
  'SCRIPT',
  'STYLE',
  'CODE',
  'PRE',
  'KBD',
  'SAMP',
  'VAR',
  'NOSCRIPT',
  'TEXTAREA',
  'INPUT',
  'SVG',
  'MATH',
  'CANVAS',
];

/**
 * Default CSS classes to skip during translation.
 * Common conventions for marking content as non-translatable.
 */
const DEFAULT_SKIP_CLASSES = ['no-translate', 'notranslate'];

/**
 * Attributes that may contain translatable text.
 */
const TRANSLATABLE_ATTRIBUTES = [
  'title',
  'alt',
  'placeholder',
  'aria-label',
  'aria-description',
];

/**
 * Checks if an element should be skipped during translation.
 */
function shouldSkipElement(element: Element, skipTags: string[], skipClasses: string[]): boolean {
  // Check tag name
  if (skipTags.includes(element.tagName)) {
    return true;
  }

  // Check classes
  for (const className of skipClasses) {
    if (element.classList.contains(className)) {
      return true;
    }
  }

  // Check for contenteditable
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check for data attribute to skip
  if (element.hasAttribute('data-ingglish-skip')) {
    return true;
  }

  return false;
}

/**
 * Counts all text nodes in a document/element.
 */
function countTextNodes(root: Node): number {
  let count = 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);

  while (walker.nextNode()) {
    const text = walker.currentNode.textContent?.trim() ?? '';
    if (text.length > 0) {
      count++;
    }
  }

  return count;
}

/**
 * Translates all text content within a DOM element.
 * Walks through all text nodes and translates them.
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
    onProgress,
  } = options;

  // Count total nodes for progress
  const totalNodes = onProgress ? countTextNodes(root) : 0;
  let processedNodes = 0;

  // Create a tree walker to iterate through all text nodes
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

  // Collect all text nodes first (to avoid modifying while iterating)
  const textNodes: Text[] = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  // Translate each text node
  for (const textNode of textNodes) {
    const originalText = textNode.textContent;
    if (originalText) {
      textNode.textContent = translateText(originalText);
    }

    processedNodes++;
    if (onProgress && totalNodes > 0) {
      onProgress(processedNodes, totalNodes);
    }
  }

  // Translate attributes if enabled
  if (translateAttributes) {
    translateElementAttributes(root, skipTags, skipClasses);
  }
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
 * Creates a MutationObserver that translates new content as it's added to the DOM.
 * Useful for single-page applications where content changes dynamically.
 *
 * @param root The root element to observe
 * @param options Configuration options
 * @returns A function to stop observing
 */
export function observeAndTranslate(
  root: Element | Document,
  options: DOMTranslatorOptions = {}
): () => void {
  requireBrowser();

  if (!isDictionaryLoaded()) {
    throw new Error('Dictionary not loaded. Call loadDictionary() first.');
  }

  const {
    skipTags = DEFAULT_SKIP_TAGS,
    skipClasses = DEFAULT_SKIP_CLASSES,
    translateAttributes = true,
  } = options;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Handle added nodes
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          const textNode = node as Text;
          const text = textNode.textContent ?? '';
          if (text.trim().length > 0) {
            // Check if we should skip this node
            let parent = textNode.parentElement;
            let shouldSkip = false;
            while (parent) {
              if (shouldSkipElement(parent, skipTags, skipClasses)) {
                shouldSkip = true;
                break;
              }
              parent = parent.parentElement;
            }
            if (!shouldSkip) {
              textNode.textContent = translateText(text);
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (!shouldSkipElement(element, skipTags, skipClasses)) {
            translateDOM(element, { skipTags, skipClasses, translateAttributes });
          }
        }
      }

      // Handle character data changes
      if (mutation.type === 'characterData') {
        const textNode = mutation.target as Text;
        const text = textNode.textContent;
        if (text?.trim()) {
          // Check if we should skip this node
          let parent = textNode.parentElement;
          let shouldSkip = false;
          while (parent) {
            if (shouldSkipElement(parent, skipTags, skipClasses)) {
              shouldSkip = true;
              break;
            }
            parent = parent.parentElement;
          }
          if (!shouldSkip) {
            // Temporarily disconnect observer to avoid infinite loop
            observer.disconnect();
            try {
              textNode.textContent = translateText(text);
            } finally {
              observer.observe(root, {
                childList: true,
                subtree: true,
                characterData: true,
              });
            }
          }
        }
      }
    }
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  // Return a function to stop observing
  return () => {
    observer.disconnect();
  };
}

/**
 * Marks an element to be skipped during translation.
 */
export function skipElement(element: Element): void {
  element.setAttribute('data-ingglish-skip', 'true');
}

/**
 * Removes the skip marker from an element.
 */
export function unskipElement(element: Element): void {
  element.removeAttribute('data-ingglish-skip');
}
