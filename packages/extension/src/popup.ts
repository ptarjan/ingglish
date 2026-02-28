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
toggleBtn.addEventListener('click', () => {
  toggleBtn.disabled = true;
  toggleBtn.textContent = 'Working...';

  // Send toggle message - don't wait for full translation to complete
  // The translation happens in the content script regardless of popup state
  chrome.runtime.sendMessage({ type: 'TOGGLE' }, (response: ToggleResponse | undefined) => {
    const lastError = chrome.runtime.lastError;

    if (lastError) {
      console.error('Toggle error:', lastError.message);
      statusText.textContent =
        lastError.message !== undefined && lastError.message !== ''
          ? lastError.message
          : 'Connection error';
      statusText.style.color = '#ef4444';
      toggleBtn.textContent = 'Try Again';
      toggleBtn.disabled = false;
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
      statusText.textContent =
        response.error !== undefined && response.error !== '' ? response.error : 'Unknown error';
      statusText.style.color = '#ef4444';
      toggleBtn.textContent = 'Try Again';
    } else {
      console.error('Unexpected response:', response);
      statusText.textContent = 'No response';
      statusText.style.color = '#ef4444';
      toggleBtn.textContent = 'Try Again';
    }
    toggleBtn.disabled = false;
  });
});

// Handle format button click
const FORMAT_ORDER: OutputFormat[] = ['ingglish', 'ipa', 'shavian', 'deseret'];
formatBtn.addEventListener('click', () => {
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
    toggleBtn.textContent = 'Turn Off';
    toggleBtn.classList.add('active');
    statusText.textContent = 'Active';
    statusText.style.color = '#22c55e';
    statusDot.style.background = '#22c55e';
  } else {
    toggleBtn.textContent = 'Translate Page';
    toggleBtn.classList.remove('active');
    statusText.textContent = 'Off';
    statusText.style.color = '#888';
    statusDot.style.background = '#888';
  }
}

const FORMAT_LABELS: Record<string, string> = {
  deseret: '𐐔𐐯𐑅𐐨𐑉𐐯𐐻',
  ingglish: 'Ingglish',
  ipa: 'IPA',
  shavian: '𐑖𐑱𐑝𐑾𐑯',
};
function updateFormatUI(): void {
  formatBtn.textContent = FORMAT_LABELS[currentFormat] ?? currentFormat;
}
