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
import { restoreOriginalText } from './original-text';

/**
 * Restores original text content that was translated.
 * Replaces tooltip spans with their original text to preserve DOM structure,
 * and restores in-place (non-tooltip) translations from the original-text
 * store.
 *
 * @param root The root element to restore
 */
export function restoreDOM(root: Document | Element): void {
  requireBrowser();

  // Parents touched during restoration; normalized at the end so repeated
  // translate/restore cycles don't accumulate fragmented text nodes.
  const touchedParents = new Set<HTMLElement>();

  // First, replace all tooltip spans with their original text
  // This preserves nested DOM structure (unlike textContent replacement)
  const wordSpans = Array.from(
    root.querySelectorAll<HTMLElement>(`.${WORD_SPAN_CLASS}[${ATTR_ORIGINAL_WORD}]`)
  );
  for (const span of wordSpans) {
    const originalWord = span.getAttribute(ATTR_ORIGINAL_WORD);
    if (originalWord !== null) {
      const parent = span.parentElement;
      if (parent) {
        touchedParents.add(parent);
      }
      const textNode = document.createTextNode(originalWord);
      span.replaceWith(textNode);
    }
  }

  // Restore in-place (non-tooltip) translations: the original text of each
  // mutated text node lives in the original-text store, keyed by the node.
  // Elements carrying the marker attribute are the direct parents of every
  // such node.
  const elementsWithOriginal = Array.from(
    root.querySelectorAll<HTMLElement>(`[${ATTR_ORIGINAL_CONTENT}]`)
  );
  for (const element of elementsWithOriginal) {
    for (const child of Array.from(element.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE && restoreOriginalText(child as Text)) {
        touchedParents.add(element);
      }
    }
    element.removeAttribute(ATTR_ORIGINAL_CONTENT);
  }

  for (const parent of touchedParents) {
    parent.normalize();
  }

  // Restore attributes - batch query for all translatable attributes at once
  const attrSelector = TRANSLATABLE_ATTRIBUTES.map(
    (attr) => `[${ATTR_ORIGINAL_PREFIX}${attr}]`
  ).join(',');
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
