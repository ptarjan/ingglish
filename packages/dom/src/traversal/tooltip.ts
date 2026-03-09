/**
 * Tooltip styles and behavior for translated words.
 * Uses JS-positioned tooltip divs appended to <body> with position:fixed
 * so they escape overflow:hidden on ancestor elements (e.g. table cells).
 */

import {
  ATTR_ORIGINAL_WORD,
  FORMAT_DIFF_CLASS,
  NOT_FOUND_CLASS,
  TOOLTIP_STYLES_ID,
  WORD_SPAN_CLASS,
} from '../constants';

const TOOLTIP_BEHAVIOR_ID = 'ingglish-tooltip-behavior';

export const TOOLTIP_STYLES = `
.${WORD_SPAN_CLASS} {
  cursor: help;
}

.ingglish-tooltip {
  position: fixed !important;
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

.ingglish-tooltip::after {
  content: '' !important;
  position: absolute !important;
  left: var(--arrow-left, 50%) !important;
  transform: translateX(-50%) !important;
  border: 5px solid transparent !important;
}

.ingglish-tooltip--above::after {
  top: 100% !important;
  border-top-color: #333 !important;
}

.ingglish-tooltip--below::after {
  bottom: 100% !important;
  border-bottom-color: #333 !important;
}

@keyframes ingglish-tooltip-fade-in {
  to { opacity: 1; }
}

.${FORMAT_DIFF_CLASS} {
  border-bottom: 1.5px dotted currentColor;
}

.${NOT_FOUND_CLASS} {
  opacity: 0.55;
  text-decoration: underline dotted currentColor;
  text-decoration-thickness: 1.5px;
  text-underline-offset: 0.2em;
}
`;

/**
 * Injects tooltip behavior: creates tooltip divs on hover,
 * positioned with position:fixed to escape overflow:hidden ancestors.
 */
export function injectTooltipBehavior(targetDoc: Document = document): void {
  if (targetDoc.documentElement.hasAttribute(`data-${TOOLTIP_BEHAVIOR_ID}`)) {
    return;
  }
  targetDoc.documentElement.setAttribute(`data-${TOOLTIP_BEHAVIOR_ID}`, 'true');

  /* v8 ignore start */
  let activeTooltip: HTMLElement | null = null;
  let activeWord: Element | null = null;

  function removeTooltip(): void {
    if (activeTooltip) {
      activeTooltip.remove();
      activeTooltip = null;
      activeWord = null;
    }
  }

  targetDoc.addEventListener(
    'mouseover',
    (e: Event) => {
      const word = (e.target as Element).closest?.(`.${WORD_SPAN_CLASS}`);

      // Still on same word - do nothing
      if (word === activeWord) {
        return;
      }

      // Moved to a different element - remove old tooltip
      removeTooltip();

      // Not on a word - done
      if (!word) {
        return;
      }

      const orig = word.getAttribute(ATTR_ORIGINAL_WORD);
      if (orig === null || orig === '') {
        return;
      }

      // Create tooltip div appended to body (escapes overflow:hidden)
      const tooltip = targetDoc.createElement('div');
      tooltip.className = 'ingglish-tooltip';
      tooltip.textContent = orig;
      targetDoc.body.append(tooltip);
      activeTooltip = tooltip;
      activeWord = word;

      // Measure and position
      const wordRect = word.getBoundingClientRect();
      const tipRect = tooltip.getBoundingClientRect();
      const viewportWidth = targetDoc.defaultView?.innerWidth ?? 0;

      // Show above if enough space, otherwise below
      const showAbove = wordRect.top > tipRect.height + 10;
      tooltip.classList.add(showAbove ? 'ingglish-tooltip--above' : 'ingglish-tooltip--below');

      const top = showAbove ? wordRect.top - tipRect.height - 5 : wordRect.bottom + 5;
      tooltip.style.top = `${top}px`;

      // Center horizontally, clamped to viewport
      let left = wordRect.left + wordRect.width / 2 - tipRect.width / 2;
      left = Math.max(4, Math.min(left, viewportWidth - tipRect.width - 4));
      tooltip.style.left = `${left}px`;

      // Point arrow at word center
      const arrowLeft = wordRect.left + wordRect.width / 2 - left;
      tooltip.style.setProperty('--arrow-left', `${arrowLeft}px`);
    },
    true
  );

  // Remove tooltip on scroll (position would be stale)
  targetDoc.addEventListener('scroll', removeTooltip, true);
  /* v8 ignore stop */
}

/**
 * Injects tooltip styles into the document if not already present.
 */
export function injectTooltipStyles(targetDoc: Document = document): void {
  if (targetDoc.querySelector(`#${TOOLTIP_STYLES_ID}`)) {
    return;
  }
  const style = targetDoc.createElement('style');
  style.id = TOOLTIP_STYLES_ID;
  style.textContent = TOOLTIP_STYLES;
  targetDoc.head?.append(style);
}
