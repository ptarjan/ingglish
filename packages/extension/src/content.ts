// Content script for Ingglish extension
// This is injected on-demand when translation is enabled (lazy loading)

import { translateDOM, observeAndTranslate, restoreDOM } from '@ingglish/core';
import type { OutputFormat } from '@ingglish/core';
import type { RestoreMessage, FormatResponse } from './types';

// State management
interface IngglishState {
  injected: boolean;
  translated: boolean;
  stopObserver: (() => void) | null;
}

// Get or initialize state on window
function getState(): IngglishState {
  const win = window as { __ingglishState?: IngglishState };
  win.__ingglishState ??= {
    injected: false,
    translated: false,
    stopObserver: null,
  };
  return win.__ingglishState;
}

const state = getState();

// Set up message listener (only once)
if (!state.injected) {
  state.injected = true;

  chrome.runtime.onMessage.addListener(
    (message: RestoreMessage, _sender, sendResponse: (response: { success: boolean }) => void) => {
      if (message.type === 'RESTORE') {
        restorePage();
        sendResponse({ success: true });
        return false;
      }
      return false;
    }
  );

  // eslint-disable-next-line no-console
  console.log('Ingglish: Content script initialized');
}

// If not yet translated, translate now
if (!state.translated) {
  // eslint-disable-next-line no-console
  console.log('Ingglish: Starting translation...');
  void translatePage();
}

// Get the output format from background script
async function getOutputFormat(): Promise<OutputFormat> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'GET_FORMAT' }, (response: FormatResponse | undefined) => {
      resolve(response?.format ?? 'ingglish');
    });
  });
}

async function translatePage(): Promise<void> {
  if (state.translated) {
    // eslint-disable-next-line no-console
    console.log('Ingglish: Already translated, skipping');
    return;
  }

  try {
    // Get the output format from storage
    const outputFormat = await getOutputFormat();
    // eslint-disable-next-line no-console
    console.log(`Ingglish: Using format: ${outputFormat}`);

    // Translate the current page with tooltips enabled
    await translateDOM(document.body, {
      showTooltips: true,
      outputFormat,
      onProgress: (processed, total) => {
        if (processed % 100 === 0) {
          // eslint-disable-next-line no-console
          console.log(`Ingglish: Translated ${processed}/${total} text nodes`);
        }
      },
    });

    // Set up observer for dynamic content (with tooltips)
    state.stopObserver = await observeAndTranslate(document.body, {
      showTooltips: true,
      outputFormat,
    });
    state.translated = true;

    // eslint-disable-next-line no-console
    console.log('Ingglish: Translation complete!');

    // Add visual indicator with format
    addTranslationBadge(outputFormat);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Ingglish translation error:', error);
  }
}

function restorePage(): void {
  // eslint-disable-next-line no-console
  console.log('Ingglish: Restoring original text...');

  // Stop observing new content
  if (state.stopObserver) {
    state.stopObserver();
    state.stopObserver = null;
  }

  // Restore original text
  restoreDOM(document.body);
  state.translated = false;

  // Remove the badge
  const badge = document.getElementById('ingglish-badge');
  if (badge) {
    badge.remove();
  }

  // eslint-disable-next-line no-console
  console.log('Ingglish: Restoration complete!');
}

function addTranslationBadge(format: OutputFormat = 'ingglish'): void {
  // Check if badge already exists
  if (document.getElementById('ingglish-badge')) {
    return;
  }

  const badge = document.createElement('div');
  badge.id = 'ingglish-badge';
  badge.textContent = format === 'ingglish' ? 'Ingglish' : 'IPA';
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

  // document.body may not exist during early page load or on some special pages
  document.body?.appendChild(badge);
}
