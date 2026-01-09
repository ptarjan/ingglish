/**
 * Text node collection utilities.
 */

import { requireBrowser } from './browser';
import { DEFAULT_SKIP_TAGS, DEFAULT_SKIP_CLASSES, shouldSkipElement } from './skip-rules';

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
