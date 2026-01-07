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
    // Ignore chrome.runtime.lastError to prevent console errors when popup closes
    void chrome.runtime.lastError;

    if (response?.success === true && response.enabled !== undefined) {
      isEnabled = response.enabled;
      updateUI();
    } else if (response?.success === false) {
      // Show error only if we got an explicit failure
      statusText.textContent = 'Error';
      statusText.style.color = '#ef4444';
      toggleBtn.textContent = 'Try Again';
    }
    toggleBtn.disabled = false;
  });

  // Close popup after a brief delay to let the message send
  setTimeout(() => window.close(), 100);
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
