// Content script for Inglish extension
// This runs on every page and translates content when requested

import { loadDictionary, translateDOM, observeAndTranslate } from '@inglish/core';
import type { TranslateMessage, TranslateResponse } from './types';

let isTranslating = false;

// Store reference to stop observing function (may be used in future for cleanup)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let stopObservingFn: (() => void) | null = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener(
  (message: TranslateMessage, _sender, sendResponse: (response: TranslateResponse) => void) => {
    if (message.type === 'TRANSLATE') {
      translatePage()
        .then(() => {
          sendResponse({ success: true });
        })
        .catch((error: unknown) => {
          // eslint-disable-next-line no-console
          console.error('Inglish translation error:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          sendResponse({ success: false, error: errorMessage });
        });
      return true; // Keep channel open for async response
    }
    return false;
  }
);

async function translatePage(): Promise<void> {
  if (isTranslating) {
    // eslint-disable-next-line no-console
    console.log('Inglish: Already translating');
    return;
  }

  isTranslating = true;
  // eslint-disable-next-line no-console
  console.log('Inglish: Starting translation...');

  try {
    // Load the dictionary
    await loadDictionary();

    // Translate the current page
    translateDOM(document.body, {
      skipTags: [
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
      ],
      skipClasses: ['no-translate', 'notranslate'],
      translateAttributes: true,
      onProgress: (processed, total) => {
        if (processed % 100 === 0) {
          // eslint-disable-next-line no-console
          console.log(`Inglish: Translated ${processed}/${total} text nodes`);
        }
      },
    });

    // Set up observer for dynamic content
    stopObservingFn = observeAndTranslate(document.body, {
      skipTags: [
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
      ],
      skipClasses: ['no-translate', 'notranslate'],
      translateAttributes: true,
    });

    // eslint-disable-next-line no-console
    console.log('Inglish: Translation complete!');

    // Add visual indicator
    addTranslationBadge();
  } catch (error) {
    isTranslating = false;
    throw error;
  }
}

function addTranslationBadge(): void {
  // Check if badge already exists
  if (document.getElementById('inglish-badge')) {
    return;
  }

  const badge = document.createElement('div');
  badge.id = 'inglish-badge';
  badge.textContent = 'Inglish';
  badge.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #6366f1, #a855f7);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 14px;
    font-weight: 600;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    cursor: pointer;
    transition: opacity 0.2s;
  `;

  badge.addEventListener('mouseenter', () => {
    badge.style.opacity = '0.8';
  });

  badge.addEventListener('mouseleave', () => {
    badge.style.opacity = '1';
  });

  badge.addEventListener('click', () => {
    badge.remove();
  });

  document.body.appendChild(badge);
}

// eslint-disable-next-line no-console
console.log('Inglish content script loaded');
