// LinkGuard Popup Script
// Handles the extension popup UI and user interactions

document.addEventListener('DOMContentLoaded', function() {
  console.log('LinkGuard popup loaded');
  
  // Initialize popup
  initializePopup();
  
  // Set up event listeners
  setupEventListeners();
  
  // Load stats
  loadStats();
});

/**
 * Initialize popup UI
 */
function initializePopup() {
  // Check if extension is active
  const statusCard = document.querySelector('.status');
  if (statusCard) {
    updateStatus('active');
  }
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Settings button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', openSettings);
  }
  
  // Help button
  const helpBtn = document.getElementById('helpBtn');
  if (helpBtn) {
    helpBtn.addEventListener('click', openHelp);
  }
}

/**
 * Load statistics from storage
 */
function loadStats() {
  chrome.storage.local.get(['linksChecked', 'threatsBlocked'], function(result) {
    const linksChecked = result.linksChecked || 0;
    const threatsBlocked = result.threatsBlocked || 0;
    
    // Update UI
    const statValues = document.querySelectorAll('.stat-value');
    if (statValues.length >= 2) {
      statValues[0].textContent = linksChecked;
      statValues[1].textContent = threatsBlocked;
    }
  });
}

/**
 * Update status display
 * @param {string} status - 'active', 'paused', or 'error'
 */
function updateStatus(status) {
  const statusCard = document.querySelector('.status');
  const statusIcon = document.querySelector('.status-icon');
  const statusTitle = document.querySelector('.status-text h2');
  const statusDescription = document.querySelector('.status-text p');
  
  if (!statusCard) return;
  
  switch(status) {
    case 'active':
      statusCard.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      statusTitle.textContent = 'Protected';
      statusDescription.textContent = 'LinkGuard is actively monitoring links on this page';
      break;
      
    case 'paused':
      statusCard.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      statusTitle.textContent = 'Paused';
      statusDescription.textContent = 'Link monitoring is currently paused';
      break;
      
    case 'error':
      statusCard.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      statusTitle.textContent = 'Error';
      statusDescription.textContent = 'There was a problem initializing LinkGuard';
      break;
  }
}

/**
 * Open settings page
 */
function openSettings() {
  // Show custom modal instead of alert
  showModal('Settings Coming Soon!', 'Stay tuned for customization options like custom whitelists, theme preferences, and notification settings.');
}

/**
 * Open help/documentation
 */
function openHelp() {
  // Open LinkGuard website in new tab
  chrome.tabs.create({
    url: 'https://linkguard.dev'
  });
}

/**
 * Show custom modal
 * @param {string} title - Modal title
 * @param {string} message - Modal message
 */
function showModal(title, message) {
  const modal = document.getElementById('customModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalClose = document.getElementById('modalClose');
  const modalOverlay = modal.querySelector('.modal-overlay');
  
  // Set content
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  
  // Show modal
  modal.classList.remove('hidden');
  
  // Close on X button click
  modalClose.onclick = () => {
    modal.classList.add('hidden');
  };
  
  // Close on overlay click
  modalOverlay.onclick = () => {
    modal.classList.add('hidden');
  };
  
  // Close on Escape key
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      modal.classList.add('hidden');
      document.removeEventListener('keydown', escapeHandler);
    }
  });
}

/**
 * Increment link check counter
 */
function incrementLinksChecked() {
  chrome.storage.local.get(['linksChecked'], function(result) {
    const count = (result.linksChecked || 0) + 1;
    chrome.storage.local.set({ linksChecked: count });
    loadStats();
  });
}

/**
 * Increment threats blocked counter
 */
function incrementThreatsBlocked() {
  chrome.storage.local.get(['threatsBlocked'], function(result) {
    const count = (result.threatsBlocked || 0) + 1;
    chrome.storage.local.set({ threatsBlocked: count });
    loadStats();
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'linkChecked') {
    incrementLinksChecked();
  } else if (request.action === 'threatBlocked') {
    incrementThreatsBlocked();
  }
});
