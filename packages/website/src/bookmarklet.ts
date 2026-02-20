/**
 * Bookmarklet entry point.
 *
 * Loaded by a bookmarklet snippet:
 *   javascript:void(function(){var s=document.createElement('script');s.src='https://ingglish.com/bookmarklet.js';document.head.appendChild(s)})()
 *
 * On first load: translates the page.
 * On subsequent loads: toggles between translated and original.
 */

import { translateDOM, restoreDOM } from '@ingglish/dom';

declare global {
  interface Window {
    __ingglishState?: 'loading' | 'translated' | 'restored';
  }
}

void (async () => {
  // Toggle if already loaded
  if (window.__ingglishState === 'translated') {
    restoreDOM(document.body);
    window.__ingglishState = 'restored';
    return;
  }
  if (window.__ingglishState === 'restored') {
    await translateDOM(document.body, { showTooltips: true });
    window.__ingglishState = 'translated';
    return;
  }
  if (window.__ingglishState === 'loading') {
    return; // Already loading
  }

  window.__ingglishState = 'loading';

  // Show loading indicator
  const indicator = document.createElement('div');
  indicator.id = '__ingglish-indicator';
  Object.assign(indicator.style, {
    position: 'fixed',
    top: '10px',
    right: '10px',
    background: '#4f46e5',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '8px',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    zIndex: '2147483647',
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    transition: 'opacity 0.3s',
  });
  indicator.textContent = 'Translating to Ingglish...';
  document.body.appendChild(indicator);

  try {
    await translateDOM(document.body, { showTooltips: true });
    window.__ingglishState = 'translated';
    indicator.textContent = 'Ingglish ✓';
    indicator.style.cursor = 'pointer';
    indicator.title = 'Click to restore original';
    indicator.addEventListener('click', () => {
      if (window.__ingglishState === 'translated') {
        restoreDOM(document.body);
        window.__ingglishState = 'restored';
        indicator.textContent = 'Original ✓';
        indicator.title = 'Click to translate again';
      } else {
        void translateDOM(document.body, { showTooltips: true }).then(() => {
          window.__ingglishState = 'translated';
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
    window.__ingglishState = undefined;
  }
})();
