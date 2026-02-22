/**
 * DOM restoration utilities.
 */

import {
  ATTR_ORIGINAL_CONTENT,
  ATTR_ORIGINAL_PREFIX,
  ATTR_ORIGINAL_WORD,
  WORD_SPAN_CLASS,
} from '../constants';
import { requireBrowser, TRANSLATABLE_ATTRIBUTES } from '../traversal';

/**
 * Restores original text content that was translated.
 * Replaces tooltip spans with their original text to preserve DOM structure.
 *
 * @param root The root element to restore
 */
export function restoreDOM(root: Document | Element): void {
  requireBrowser();

  // First, replace all tooltip spans with their original text
  // This preserves nested DOM structure (unlike textContent replacement)
  // eslint-disable-next-line unicorn/prefer-spread -- spreading NodeList gives any[]
  const wordSpans = Array.from(
    root.querySelectorAll<HTMLElement>(`.${WORD_SPAN_CLASS}[${ATTR_ORIGINAL_WORD}]`)
  );
  for (const span of wordSpans) {
    const originalWord = span.getAttribute(ATTR_ORIGINAL_WORD);
    if (originalWord !== null) {
      const textNode = document.createTextNode(originalWord);
      span.replaceWith(textNode);
    }
  }

  // Clean up any original content attributes (no longer needed for restoration)
  // eslint-disable-next-line unicorn/prefer-spread -- spreading NodeList gives any[]
  const elementsWithOriginal = Array.from(
    root.querySelectorAll<HTMLElement>(`[${ATTR_ORIGINAL_CONTENT}]`)
  );
  for (const element of elementsWithOriginal) {
    element.removeAttribute(ATTR_ORIGINAL_CONTENT);
  }

  // Restore attributes - batch query for all translatable attributes at once
  const attrSelector = TRANSLATABLE_ATTRIBUTES.map(
    (attr) => `[${ATTR_ORIGINAL_PREFIX}${attr}]`
  ).join(',');
  // eslint-disable-next-line unicorn/prefer-spread -- spreading NodeList gives any[]
  const elementsWithTranslatedAttrs = Array.from(root.querySelectorAll<HTMLElement>(attrSelector));

  for (const element of elementsWithTranslatedAttrs) {
    for (const attrName of TRANSLATABLE_ATTRIBUTES) {
      const originalAttrName = `${ATTR_ORIGINAL_PREFIX}${attrName}`;
      const originalValue = element.getAttribute(originalAttrName);
      if (originalValue !== null) {
        element.setAttribute(attrName, originalValue);
        element.removeAttribute(originalAttrName);
      }
    }
  }
}
