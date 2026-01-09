/**
 * CSS styles for tooltip functionality.
 * Shows original text on hover for translated words.
 */

export const TOOLTIP_STYLES = `
.ingglish-word {
  position: relative;
  cursor: help;
}

.ingglish-word:hover::after {
  content: attr(data-ingglish-orig);
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

.ingglish-word:hover::before {
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
  if (targetDoc.getElementById('ingglish-tooltip-styles')) {
    return;
  }
  const style = targetDoc.createElement('style');
  style.id = 'ingglish-tooltip-styles';
  style.textContent = TOOLTIP_STYLES;
  targetDoc.head?.appendChild(style);
}
