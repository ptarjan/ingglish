/**
 * Text node collection utilities.
 */

import { requireBrowser } from './browser';
import { DEFAULT_SKIP_CLASSES, DEFAULT_SKIP_TAGS, shouldSkipElement } from './skip-rules';

/**
 * Collects all translatable text nodes from a DOM tree.
 * Skips elements based on tags, classes, and data attributes.
 *
 * Optimized to use FILTER_REJECT on skip elements, which skips entire subtrees
 * instead of checking each text node's parent chain individually.
 */
export function collectTextNodes(
  root: Document | Element,
  skipTags: string[] = DEFAULT_SKIP_TAGS,
  skipClasses: string[] = DEFAULT_SKIP_CLASSES
): Text[] {
  requireBrowser();
  const textNodes: Text[] = [];

  // Use SHOW_ALL to visit both elements and text nodes
  // This allows FILTER_REJECT on elements to skip entire subtrees
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node): number {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // For elements: reject (skip subtree) if should skip, otherwise skip (continue into children)
        return shouldSkipElement(node as Element, skipTags, skipClasses)
          ? NodeFilter.FILTER_REJECT
          : NodeFilter.FILTER_SKIP;
      }

      // For text nodes: accept if non-empty
      const text = (node as Text).textContent?.trim() ?? '';
      return text.length > 0 ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP;
    },
  });

  while (walker.nextNode()) {
    if (walker.currentNode.nodeType === Node.TEXT_NODE) {
      textNodes.push(walker.currentNode as Text);
    }
  }

  return textNodes;
}
