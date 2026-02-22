/**
 * Bookmarklet entry point.
 *
 * Loaded by a bookmarklet snippet:
 *   javascript:void(function(){var s=document.createElement('script');s.src='https://ingglish.com/bookmarklet.js';document.head.appendChild(s)})()
 *
 * On first load: translates the page.
 * On subsequent loads: toggles between translated and original.
 */

import { restoreDOM, translateDOM } from '@ingglish/dom';

declare global {
  var __ingglishState: 'loading' | 'restored' | 'translated' | undefined;
}

void (async () => {
  // Toggle if already loaded
  if (globalThis.__ingglishState === 'translated') {
    restoreDOM(document.body);
    globalThis.__ingglishState = 'restored';
    return;
  }
  if (globalThis.__ingglishState === 'restored') {
    await translateDOM(document.body, { showTooltips: true });
    globalThis.__ingglishState = 'translated';
    return;
  }
  if (globalThis.__ingglishState === 'loading') {
    return; // Already loading
  }

  globalThis.__ingglishState = 'loading';

  // Show loading indicator
  const indicator = document.createElement('div');
  indicator.id = '__ingglish-indicator';
  Object.assign(indicator.style, {
    background: '#4f46e5',
    borderRadius: '8px',
    bottom: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    color: 'white',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    padding: '8px 16px',
    position: 'fixed',
    right: '10px',
    transition: 'opacity 0.3s',
    zIndex: '2147483647',
  });
  indicator.textContent = 'Translating to Ingglish...';
  document.body.append(indicator);

  try {
    await translateDOM(document.body, { showTooltips: true });
    globalThis.__ingglishState = 'translated';
    indicator.textContent = 'Ingglish ✓';
    indicator.style.cursor = 'pointer';
    indicator.title = 'Click to restore original';
    indicator.addEventListener('click', () => {
      if (globalThis.__ingglishState === 'translated') {
        restoreDOM(document.body);
        globalThis.__ingglishState = 'restored';
        indicator.textContent = 'Original ✓';
        indicator.title = 'Click to translate again';
      } else {
        void translateDOM(document.body, { showTooltips: true }).then(() => {
          globalThis.__ingglishState = 'translated';
          indicator.textContent = 'Ingglish ✓';
          indicator.title = 'Click to restore original';
        });
      }
    });
    setTimeout(() => {
      indicator.style.opacity = '0.6';
    }, 2000);
  } catch {
    indicator.textContent = 'Translation failed';
    indicator.style.background = '#dc2626';
    setTimeout(() => {
      indicator.remove();
    }, 3000);
    globalThis.__ingglishState = undefined;
  }
})();
