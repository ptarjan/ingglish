// Popup script for Ingglish extension

import type { OutputFormat } from '@ingglish/phonemes';
import type { FormatResponse, StateResponse, ToggleResponse } from './types';

const toggleBtn = document.querySelector<HTMLButtonElement>('#toggle-btn');
const statusText = document.querySelector<HTMLSpanElement>('#status-text');
const statusDot = document.querySelector<HTMLSpanElement>('#status-dot');
const formatBtn = document.querySelector<HTMLButtonElement>('#format-btn');

// Validate required elements exist
if (!toggleBtn || !statusText || !statusDot || !formatBtn) {
  throw new Error('Required popup elements not found');
}

// TypeScript now knows these are non-null after the check above
const toggleBtnEl = toggleBtn;
const statusTextEl = statusText;
const statusDotEl = statusDot;
const formatBtnEl = formatBtn;

let isEnabled = false;
let currentFormat: OutputFormat = 'ingglish';

// Get initial state
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response: StateResponse | undefined) => {
  if (response !== undefined) {
    isEnabled = response.enabled;
    currentFormat = response.format ?? 'ingglish';
    updateUI();
    updateFormatUI();
  }
});

// Handle toggle button click
// Note: activeTab permission is granted when user clicks the extension icon,
// so we don't need to request additional permissions for the initial toggle
toggleBtnEl.addEventListener('click', () => {
  toggleBtnEl.disabled = true;
  toggleBtnEl.textContent = 'Working...';

  // Send toggle message - don't wait for full translation to complete
  // The translation happens in the content script regardless of popup state
  chrome.runtime.sendMessage({ type: 'TOGGLE' }, (response: ToggleResponse | undefined) => {
    const lastError = chrome.runtime.lastError;

    if (lastError) {
      console.error('Toggle error:', lastError.message);
      statusTextEl.textContent =
        lastError.message !== undefined && lastError.message !== ''
          ? lastError.message
          : 'Connection error';
      statusTextEl.style.color = '#ef4444';
      toggleBtnEl.textContent = 'Try Again';
      toggleBtnEl.disabled = false;
      return;
    }

    if (response?.success === true && response.enabled !== undefined) {
      isEnabled = response.enabled;
      updateUI();
      // Close popup on success
      setTimeout(() => {
        window.close();
      }, 50);
    } else if (response?.success === false) {
      // Show error with details
      console.error('Toggle failed:', response.error);
      statusTextEl.textContent =
        response.error !== undefined && response.error !== '' ? response.error : 'Unknown error';
      statusTextEl.style.color = '#ef4444';
      toggleBtnEl.textContent = 'Try Again';
    } else {
      console.error('Unexpected response:', response);
      statusTextEl.textContent = 'No response';
      statusTextEl.style.color = '#ef4444';
      toggleBtnEl.textContent = 'Try Again';
    }
    toggleBtnEl.disabled = false;
  });
});

// Handle format button click
const FORMAT_ORDER: OutputFormat[] = ['ingglish', 'ipa', 'shavian', 'deseret'];
formatBtnEl.addEventListener('click', () => {
  const newFormat = FORMAT_ORDER[(FORMAT_ORDER.indexOf(currentFormat) + 1) % FORMAT_ORDER.length];
  chrome.runtime.sendMessage(
    { format: newFormat, type: 'SET_FORMAT' },
    (response: FormatResponse | undefined) => {
      if (response?.format !== undefined) {
        currentFormat = response.format;
        updateFormatUI();
      }
    }
  );
});

function updateUI(): void {
  if (isEnabled) {
    toggleBtnEl.textContent = 'Turn Off';
    toggleBtnEl.classList.add('active');
    statusTextEl.textContent = 'Active';
    statusTextEl.style.color = '#22c55e';
    statusDotEl.style.background = '#22c55e';
  } else {
    toggleBtnEl.textContent = 'Translate Page';
    toggleBtnEl.classList.remove('active');
    statusTextEl.textContent = 'Off';
    statusTextEl.style.color = '#888';
    statusDotEl.style.background = '#888';
  }
}

const FORMAT_LABELS: Record<string, string> = {
  deseret: '𐐔𐐯𐑅𐐨𐑉𐐯𐐻',
  ingglish: 'Ingglish',
  ipa: 'IPA',
  shavian: '𐑖𐑱𐑝𐑾𐑯',
};
function updateFormatUI(): void {
  formatBtnEl.textContent = FORMAT_LABELS[currentFormat] ?? currentFormat;
}
