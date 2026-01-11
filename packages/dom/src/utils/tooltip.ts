/**
 * CSS styles for tooltip functionality.
 * Shows original text on hover for translated words.
 */

import { WORD_SPAN_CLASS, TOOLTIP_STYLES_ID, ATTR_ORIGINAL_WORD } from '../constants';

export const TOOLTIP_STYLES = `
.${WORD_SPAN_CLASS} {
  position: relative;
  display: inline;
  cursor: help;
  vertical-align: baseline;
}

.${WORD_SPAN_CLASS}:hover::after {
  content: attr(${ATTR_ORIGINAL_WORD});
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
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

.${WORD_SPAN_CLASS}:hover::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent !important;
  border-top-color: #333 !important;
  margin-bottom: -10px !important;
  z-index: 2147483647 !important;
  pointer-events: none !important;
  opacity: 0;
  animation: ingglish-tooltip-fade-in 0.15s ease-out forwards;
}

@keyframes ingglish-tooltip-fade-in {
  to { opacity: 1; }
}
`;

/**
 * Injects tooltip styles into the document if not already present.
 */
export function injectTooltipStyles(targetDoc: Document = document): void {
  if (targetDoc.getElementById(TOOLTIP_STYLES_ID)) {
    return;
  }
  const style = targetDoc.createElement('style');
  style.id = TOOLTIP_STYLES_ID;
  style.textContent = TOOLTIP_STYLES;
  targetDoc.head?.appendChild(style);
}
