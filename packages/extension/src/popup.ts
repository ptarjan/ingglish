// Popup script for Inglish extension

const toggleBtn = document.getElementById('toggle-btn') as HTMLButtonElement;
const statusText = document.getElementById('status-text') as HTMLSpanElement;
const statusDot = document.getElementById('status-dot') as HTMLDivElement;

let isEnabled = false;

// Get initial state
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response) => {
  if (response) {
    isEnabled = response.enabled;
    updateUI();
  }
});

// Handle toggle button click
toggleBtn.addEventListener('click', async () => {
  toggleBtn.disabled = true;
  toggleBtn.textContent = 'Working...';

  chrome.runtime.sendMessage({ type: 'TOGGLE' }, (response) => {
    if (response?.success) {
      isEnabled = response.enabled;
      updateUI();
    } else {
      // Show error
      statusText.textContent = 'Error';
      statusText.style.color = '#ef4444';
      toggleBtn.textContent = 'Try Again';
    }
    toggleBtn.disabled = false;
  });
});

function updateUI() {
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
