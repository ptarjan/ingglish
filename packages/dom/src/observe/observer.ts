/**
 * MutationObserver-based DOM translation for dynamic content.
 */

import { translateSync } from '@ingglish/core';
import { translateDOMSync } from '../translate/translator';
import { createTooltipFragment } from '../translate/tooltip-fragment';
import type { DOMTranslatorOptions } from '../types';
import {
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  requireBrowser,
  shouldSkipElement,
  shouldSkipTextNode,
} from '../utils';

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

  const {
    skipTags = DEFAULT_SKIP_TAGS,
    skipClasses = DEFAULT_SKIP_CLASSES,
    translateAttributes = true,
    showTooltips = false,
    outputFormat = 'ingglish',
  } = options;

  // Batching: collect nodes and process in next microtask
  let pendingTextNodes: Text[] = [];
  let pendingElements: Element[] = [];
  let batchScheduled = false;

  function processBatch() {
    batchScheduled = false;

    // Disconnect observer during batch processing to avoid re-triggering on our own changes
    observer.disconnect();
    try {
      // Process collected text nodes
      for (const textNode of pendingTextNodes) {
        // Check if node is still in DOM and not already processed
        if (textNode.parentNode?.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        const text = textNode.textContent ?? '';
        if (text.trim().length === 0) {
          continue;
        }
        if (shouldSkipTextNode(textNode, skipTags, skipClasses)) {
          continue;
        }
        if (showTooltips) {
          const fragment = createTooltipFragment(text, outputFormat);
          textNode.replaceWith(fragment);
        } else {
          textNode.textContent = translateSync(text, outputFormat);
        }
      }
      pendingTextNodes = [];

      // Process collected elements
      for (const element of pendingElements) {
        // Check if element is still in DOM
        if (!element.parentNode) {
          continue;
        }
        if (shouldSkipElement(element, skipTags, skipClasses)) {
          continue;
        }
        translateDOMSync(element, {
          skipTags,
          skipClasses,
          translateAttributes,
          showTooltips,
          outputFormat,
        });
      }
      pendingElements = [];
    } finally {
      // Reconnect observer
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }
  }

  function scheduleBatch() {
    if (!batchScheduled) {
      batchScheduled = true;
      queueMicrotask(processBatch);
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Handle added nodes - collect for batch processing
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          const textNode = node as Text;
          const text = textNode.textContent ?? '';
          if (text.trim().length > 0) {
            pendingTextNodes.push(textNode);
            scheduleBatch();
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          pendingElements.push(node as Element);
          scheduleBatch();
        }
      }

      // Handle character data changes (process immediately to avoid complexity)
      if (mutation.type === 'characterData' && !showTooltips) {
        const textNode = mutation.target as Text;
        const text = textNode.textContent;
        if (text?.trim()) {
          if (!shouldSkipTextNode(textNode, skipTags, skipClasses)) {
            // Temporarily disconnect observer to avoid infinite loop
            observer.disconnect();
            try {
              textNode.textContent = translateSync(text, outputFormat);
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
