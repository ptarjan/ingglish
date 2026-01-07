/**
 * MutationObserver-based DOM translation for dynamic content.
 */
import { translateText, isDictionaryLoaded } from './translator';
import { translateDOM } from './dom-translator';
import type { DOMTranslatorOptions } from './types';
import {
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  requireBrowser,
  shouldSkipElement,
  shouldSkipTextNode,
} from './dom-utils';

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
            if (!shouldSkipTextNode(textNode, skipTags, skipClasses)) {
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
          if (!shouldSkipTextNode(textNode, skipTags, skipClasses)) {
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
