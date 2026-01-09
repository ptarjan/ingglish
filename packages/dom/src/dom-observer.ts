/**
 * MutationObserver-based DOM translation for dynamic content.
 */
import { translateSync, translateSyncWithMapping } from '@ingglish/core';
import { translateDOMSync } from './dom-translator';
import type { DOMTranslatorOptions, OutputFormat } from './types';
import {
  DEFAULT_SKIP_TAGS,
  DEFAULT_SKIP_CLASSES,
  requireBrowser,
  shouldSkipElement,
  shouldSkipTextNode,
} from './dom-utils';

/**
 * Creates a document fragment with tooltip spans for each translated word.
 */
function createTooltipFragmentForObserver(
  text: string,
  format: OutputFormat = 'ingglish'
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const tokens = translateSyncWithMapping(text, format);

  for (const token of tokens) {
    if (token.isWord && token.original !== token.translated) {
      // data-ingglish-orig stores original text AND marks as translated (prevents re-processing)
      const span = document.createElement('span');
      span.className = 'ingglish-word';
      span.setAttribute('data-ingglish-orig', token.original);
      span.textContent = token.translated;
      fragment.appendChild(span);
    } else {
      fragment.appendChild(document.createTextNode(token.translated));
    }
  }

  return fragment;
}

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

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      // Handle added nodes
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.TEXT_NODE) {
          const textNode = node as Text;
          const text = textNode.textContent ?? '';
          if (text.trim().length > 0) {
            if (!shouldSkipTextNode(textNode, skipTags, skipClasses)) {
              if (showTooltips) {
                const fragment = createTooltipFragmentForObserver(text, outputFormat);
                textNode.replaceWith(fragment);
              } else {
                textNode.textContent = translateSync(text, outputFormat);
              }
            }
          }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (!shouldSkipElement(element, skipTags, skipClasses)) {
            translateDOMSync(element, {
              skipTags,
              skipClasses,
              translateAttributes,
              showTooltips,
              outputFormat,
            });
          }
        }
      }

      // Handle character data changes (only for non-tooltip mode to avoid complexity)
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
