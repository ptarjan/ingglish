/**
 * Shared utilities for DOM translation.
 */

/**
 * CSS styles for tooltip functionality.
 * Shows original text on hover for translated words.
 */
export const TOOLTIP_STYLES = `
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
  background: #333 !important;
  color: #fff !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  font-size: 12px !important;
  font-family: system-ui, -apple-system, sans-serif !important;
  line-height: 1.4 !important;
  white-space: nowrap !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  opacity: 0;
  animation: ingglish-tooltip-fade-in 0.15s ease-out forwards;
}

.ingglish-word:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent !important;
  border-top-color: #333 !important;
  margin-bottom: -10px !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  opacity: 0;
  animation: ingglish-tooltip-fade-in 0.15s ease-out forwards;
}

@keyframes ingglish-tooltip-fade-in {
  to { opacity: 1; }
}
`;

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
 * Checks if we're in a browser environment.
 */
export function isBrowser(): boolean {
  return typeof document !== 'undefined' && typeof window !== 'undefined';
}

/**
 * Throws an error if not in a browser environment.
 */
export function requireBrowser(): void {
  if (!isBrowser()) {
    throw new Error('DOM translation requires a browser environment');
  }
}

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

/**
 * Collects all translatable text nodes from a DOM tree.
 * Skips elements based on tags, classes, and data attributes.
 */
export function collectTextNodes(
  root: Element | Document,
  skipTags: string[] = DEFAULT_SKIP_TAGS,
  skipClasses: string[] = DEFAULT_SKIP_CLASSES
): Text[] {
  requireBrowser();
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Text): number {
      const text = node.textContent?.trim() ?? '';
      if (text.length === 0) {
        return NodeFilter.FILTER_SKIP;
      }

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
 * Normalizes apostrophes to standard ASCII apostrophe.
 * Handles: ' (U+2019), ' (U+2018), ʼ (U+02BC)
 */
export function normalizeApostrophes(text: string): string {
  return text.replace(/[\u2018\u2019\u02BC]/g, "'");
}

/**
 * Extracts unique words from text for batch translation.
 * Returns lowercase words for dictionary lookup.
 */
export function extractWords(text: string): string[] {
  const normalized = normalizeApostrophes(text);
  const matches = normalized.match(/\b[a-zA-Z']+\b/g) ?? [];
  return [...new Set(matches.map((w) => w.toLowerCase()))];
}

/**
 * Extracts all unique words from an array of text nodes.
 * Useful for batch translation scenarios.
 */
export function extractWordsFromNodes(textNodes: Text[]): string[] {
  const allWords: string[] = [];
  for (const node of textNodes) {
    const words = extractWords(node.textContent ?? '');
    allWords.push(...words);
  }
  return [...new Set(allWords)];
}

/**
 * Applies case transformation from original word to translated word.
 * Preserves ALL CAPS and Title Case.
 */
export function applyCase(original: string, translated: string): string {
  // ALL CAPS
  if (original.length > 1 && original === original.toUpperCase() && /[A-Z]/.test(original)) {
    return translated.toUpperCase();
  }
  // Title Case
  if (/^[A-Z]/.test(original) && original.slice(1) === original.slice(1).toLowerCase()) {
    return translated.charAt(0).toUpperCase() + translated.slice(1);
  }
  return translated;
}

/**
 * Injects tooltip styles into the document if not already present.
 */
export function injectTooltipStyles(targetDoc: Document = document): void {
  if (targetDoc.getElementById('ingglish-tooltip-styles')) {
    return;
  }
  const style = targetDoc.createElement('style');
  style.id = 'ingglish-tooltip-styles';
  style.textContent = TOOLTIP_STYLES;
  targetDoc.head?.appendChild(style);
}
