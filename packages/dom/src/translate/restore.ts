/**
 * DOM restoration utilities.
 */

import { requireBrowser, TRANSLATABLE_ATTRIBUTES } from '../utils';

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
