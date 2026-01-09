/**
 * Skip rules for DOM translation.
 * Determines which elements and text nodes should be skipped.
 */

/**
 * Default tags to skip during translation.
 * These typically contain code, scripts, or non-translatable content.
 */
export const DEFAULT_SKIP_TAGS = [
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
export const DEFAULT_SKIP_CLASSES = ['no-translate', 'notranslate'];

/**
 * Attributes that may contain translatable text.
 */
export const TRANSLATABLE_ATTRIBUTES = [
  'title',
  'alt',
  'placeholder',
  'aria-label',
  'aria-description',
];

/**
 * Checks if an element should be skipped during translation.
 */
export function shouldSkipElement(
  element: Element,
  skipTags: string[],
  skipClasses: string[]
): boolean {
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

  // Check for already-translated elements (marked with data-ingglish-orig)
  if (element.hasAttribute('data-ingglish-orig')) {
    return true;
  }

  return false;
}

/**
 * Checks if a text node should be skipped by walking up to parent elements.
 */
export function shouldSkipTextNode(
  textNode: Text,
  skipTags: string[],
  skipClasses: string[]
): boolean {
  let parent = textNode.parentElement;
  while (parent) {
    if (shouldSkipElement(parent, skipTags, skipClasses)) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
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
