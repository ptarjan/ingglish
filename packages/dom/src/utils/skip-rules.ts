/**
 * Skip rules for DOM translation.
 * Determines which elements and text nodes should be skipped.
 */

import { ATTR_ORIGINAL_WORD, ATTR_SKIP } from '../constants';

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

/** Pre-built Set for O(1) tag lookup (internal only) */
const DEFAULT_SKIP_TAGS_SET = new Set(DEFAULT_SKIP_TAGS);

/**
 * Default CSS classes to skip during translation.
 * Common conventions for marking content as non-translatable.
 */
export const DEFAULT_SKIP_CLASSES = ['no-translate', 'notranslate'];

/** Pre-built Set for O(1) class lookup (internal only) */
const DEFAULT_SKIP_CLASSES_SET = new Set(DEFAULT_SKIP_CLASSES);

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
 * Internal helper: checks element skip with O(1) Set lookups.
 */
function checkElementSkip(
  element: Element,
  skipTagsSet: Set<string>,
  skipClassesSet: Set<string>
): boolean {
  // Check tag name - O(1) with Set
  if (skipTagsSet.has(element.tagName)) {
    return true;
  }

  // Check classes - O(1) per class with Set
  // Indexed loop avoids Array.from allocation; classList is a DOMTokenList
  const classList = element.classList;
  const classCount = classList.length;
  for (let i = 0; i < classCount; i++) {
    if (skipClassesSet.has(classList[i]!)) {
      return true;
    }
  }

  // Check for contenteditable
  if (element.getAttribute('contenteditable') === 'true') {
    return true;
  }

  // Check for data attribute to skip
  if (element.hasAttribute(ATTR_SKIP)) {
    return true;
  }

  // Check for already-translated elements (marked with ATTR_ORIGINAL_WORD)
  if (element.hasAttribute(ATTR_ORIGINAL_WORD)) {
    return true;
  }

  return false;
}

/**
 * Checks if an element should be skipped during translation.
 */
export function shouldSkipElement(
  element: Element,
  skipTags: string[],
  skipClasses: string[]
): boolean {
  // Convert to Sets for O(1) lookup (cached if using defaults)
  const tagsSet = skipTags === DEFAULT_SKIP_TAGS ? DEFAULT_SKIP_TAGS_SET : new Set(skipTags);
  const classesSet =
    skipClasses === DEFAULT_SKIP_CLASSES ? DEFAULT_SKIP_CLASSES_SET : new Set(skipClasses);
  return checkElementSkip(element, tagsSet, classesSet);
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
  element.setAttribute(ATTR_SKIP, 'true');
}

/**
 * Removes the skip marker from an element.
 */
export function unskipElement(element: Element): void {
  element.removeAttribute(ATTR_SKIP);
}
