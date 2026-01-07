// Popup script for Ingglish extension

import type { StateResponse, ToggleResponse } from './types';

const toggleBtn = document.getElementById('toggle-btn');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');

// Validate required elements exist
if (!toggleBtn || !statusText || !statusDot) {
  throw new Error('Required popup elements not found');
}

let isEnabled = false;

// Get initial state
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response: StateResponse | undefined) => {
  if (response !== undefined) {
    isEnabled = response.enabled;
    updateUI();
  }
});

// Handle toggle button click
toggleBtn.addEventListener('click', () => {
  toggleBtn.disabled = true;
  toggleBtn.textContent = 'Working...';

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
