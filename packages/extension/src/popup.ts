// Popup script for Ingglish extension

import type { OutputFormat } from '@ingglish/core';
import type { StateResponse, ToggleResponse, FormatResponse } from './types';

const toggleBtn = document.getElementById('toggle-btn');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const formatBtn = document.getElementById('format-btn');

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

// Request host permission for the current tab if needed
async function ensureHostPermission(): Promise<boolean> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tabs[0]?.url;

  if (
    url === undefined ||
    url === '' ||
    url.startsWith('chrome://') ||
    url.startsWith('chrome-extension://')
  ) {
    // Can't inject into chrome:// pages
    return false;
  }

  // Check if we already have permission
  const hasPermission = await chrome.permissions.contains({ origins: [url] });
  if (hasPermission) {
    return true;
  }

  // Request permission - this shows a prompt to the user
  try {
    return await chrome.permissions.request({ origins: ['<all_urls>'] });
  } catch {
    return false;
  }
}

// Handle toggle button click
toggleBtn.addEventListener('click', () => {
  toggleBtn.disabled = true;
  toggleBtn.textContent = 'Working...';

  // Wrap async logic
  void (async () => {
    // If enabling, ensure we have permission first
    if (!isEnabled) {
      const hasPermission = await ensureHostPermission();
      if (!hasPermission) {
        statusText.textContent = 'Permission denied';
        statusText.style.color = '#ef4444';
        toggleBtn.textContent = 'Translate Page';
        toggleBtn.disabled = false;
        return;
      }
    }

    // Send toggle message - don't wait for full translation to complete
    // The translation happens in the content script regardless of popup state
    chrome.runtime.sendMessage({ type: 'TOGGLE' }, (response: ToggleResponse | undefined) => {
      const lastError = chrome.runtime.lastError;

      if (lastError) {
        // eslint-disable-next-line no-console
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
        // eslint-disable-next-line no-console
        console.error('Toggle failed:', response.error);
        statusText.textContent =
          response.error !== undefined && response.error !== '' ? response.error : 'Unknown error';
        statusText.style.color = '#ef4444';
        toggleBtn.textContent = 'Try Again';
      } else {
        // eslint-disable-next-line no-console
        console.error('Unexpected response:', response);
        statusText.textContent = 'No response';
        statusText.style.color = '#ef4444';
        toggleBtn.textContent = 'Try Again';
      }
      toggleBtn.disabled = false;
    });
  })();
});

// Handle format button click
formatBtn.addEventListener('click', () => {
  const newFormat: OutputFormat = currentFormat === 'ingglish' ? 'ipa' : 'ingglish';
  chrome.runtime.sendMessage(
    { type: 'SET_FORMAT', format: newFormat },
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

function updateFormatUI(): void {
  formatBtn.textContent = currentFormat === 'ingglish' ? 'Ingglish' : 'IPA';
}
