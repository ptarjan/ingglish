// Content script for Ingglish extension
// This is injected on-demand when translation is enabled (lazy loading)

import { translateDOM, observeAndTranslate } from '@ingglish/core';

// Guard against double injection
if ((window as { __ingglishInjected?: boolean }).__ingglishInjected === true) {
  // eslint-disable-next-line no-console
  console.log('Ingglish: Already injected, skipping');
} else {
  (window as { __ingglishInjected?: boolean }).__ingglishInjected = true;

  // eslint-disable-next-line no-console
  console.log('Ingglish: Translator injected, starting translation...');

  void translatePage();
}

async function translatePage(): Promise<void> {
  try {
    // Translate the current page
    await translateDOM(document.body, {
      onProgress: (processed, total) => {
        if (processed % 100 === 0) {
          // eslint-disable-next-line no-console
          console.log(`Ingglish: Translated ${processed}/${total} text nodes`);
        }
      },
    });

    // Set up observer for dynamic content
    await observeAndTranslate(document.body);

    // eslint-disable-next-line no-console
    console.log('Ingglish: Translation complete!');

    // Add visual indicator
    addTranslationBadge();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Ingglish translation error:', error);
  }
}

function addTranslationBadge(): void {
  // Check if badge already exists
  if (document.getElementById('ingglish-badge')) {
    return;
  }

  const badge = document.createElement('div');
  badge.id = 'ingglish-badge';
  badge.textContent = 'Ingglish';
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
