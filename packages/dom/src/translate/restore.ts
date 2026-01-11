/**
 * DOM restoration utilities.
 */

import { requireBrowser, TRANSLATABLE_ATTRIBUTES } from '../utils';

/**
 * Restores original text content that was translated.
 * Replaces tooltip spans with their original text to preserve DOM structure.
 *
 * @param root The root element to restore
 */
export function restoreDOM(root: Element | Document): void {
  requireBrowser();

  // First, replace all tooltip spans with their original text
  // This preserves nested DOM structure (unlike textContent replacement)
  const wordSpans = Array.from(root.querySelectorAll('.ingglish-word[data-ingglish-orig]'));
  for (const span of wordSpans) {
    const originalWord = span.getAttribute('data-ingglish-orig');
    if (originalWord !== null) {
      const textNode = document.createTextNode(originalWord);
      span.replaceWith(textNode);
    }
  }

  // Clean up any data-ingglish-original attributes (no longer needed for restoration)
  const elementsWithOriginal = Array.from(root.querySelectorAll('[data-ingglish-original]'));
  for (const element of elementsWithOriginal) {
    element.removeAttribute('data-ingglish-original');
  }

  // Restore attributes - batch query for all translatable attributes at once
  const attrSelector = TRANSLATABLE_ATTRIBUTES.map(
    (attr) => `[data-ingglish-original-${attr}]`
  ).join(',');
  const elementsWithTranslatedAttrs = Array.from(root.querySelectorAll(attrSelector));

  for (const element of elementsWithTranslatedAttrs) {
    for (const attrName of TRANSLATABLE_ATTRIBUTES) {
      const originalAttrName = `data-ingglish-original-${attrName}`;
      const originalValue = element.getAttribute(originalAttrName);
      if (originalValue !== null) {
        element.setAttribute(attrName, originalValue);
        element.removeAttribute(originalAttrName);
      }
    }
  }
}
