// LinkGuard Content Script
// Injected into every web page to detect and analyze links

console.log('LinkGuard content script loaded');

// State
let currentTooltip = null;
let hoveredLink = null;
let checkTimeout = null;

/**
 * Initialize content script
 */
function init() {
  console.log('LinkGuard: Initializing content script');
  
  // Set up link hover detection
  setupLinkDetection();
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessage);
}

/**
 * Set up link hover detection
 */
function setupLinkDetection() {
  // Listen for mouseover on all links
  document.addEventListener('mouseover', handleMouseOver, true);
  
  // Listen for mouseout to hide tooltip
  document.addEventListener('mouseout', handleMouseOut, true);
  
  // Listen for scroll to reposition tooltip
  document.addEventListener('scroll', handleScroll, true);
}

/**
 * Handle mouse over event
 * @param {MouseEvent} event
 */
function handleMouseOver(event) {
  const link = event.target.closest('a');
  
  if (!link || !link.href) return;
  
  // Ignore if already checking this link
  if (hoveredLink === link) return;
  
  hoveredLink = link;
  
  // Clear any existing timeout
  if (checkTimeout) {
    clearTimeout(checkTimeout);
  }
  
  // Wait 300ms before showing tooltip (avoid flashing on quick hover)
  checkTimeout = setTimeout(() => {
    checkLink(link, event.clientX, event.clientY);
  }, 300);
}

/**
 * Handle mouse out event
 * @param {MouseEvent} event
 */
function handleMouseOut(event) {
  const link = event.target.closest('a');
  
  if (link === hoveredLink) {
    hoveredLink = null;
    
    if (checkTimeout) {
      clearTimeout(checkTimeout);
      checkTimeout = null;
    }
    
    hideTooltip();
  }
}

/**
 * Handle scroll event
 */
function handleScroll() {
  // Hide tooltip when user scrolls
  if (currentTooltip) {
    hideTooltip();
  }
}

/**
 * Check a link's safety
 * @param {HTMLAnchorElement} link
 * @param {number} x - Mouse X position
 * @param {number} y - Mouse Y position
 */
async function checkLink(link, x, y) {
  try {
    const url = link.href;
    
    console.log('LinkGuard: Checking link:', url);
    
    // Show loading tooltip
    showTooltip({
      url: url,
      status: 'loading',
      message: 'Checking link safety...'
    }, x, y);
    
    // Send to background script for analysis
    chrome.runtime.sendMessage({
      action: 'checkLink',
      url: url
    }, (response) => {
      // Check for errors
      if (chrome.runtime.lastError) {
        console.error('LinkGuard: Runtime error:', chrome.runtime.lastError);
        showTooltip({
          url: url,
          status: 'error',
          message: 'Failed to check link'
        }, x, y);
        return;
      }
      
      // Check if we got a response
      if (!response) {
        console.error('LinkGuard: No response from background script');
        showTooltip({
          url: url,
          status: 'error',
          message: 'No response from analysis'
        }, x, y);
        return;
      }
      
      console.log('LinkGuard: Received response:', response);
      
      // Update tooltip with results (only if still hovering same link)
      if (hoveredLink === link) {
        showTooltip(response, x, y);
      }
    });
    
    // Notify popup about link check
    chrome.runtime.sendMessage({ action: 'linkChecked' });
    
  } catch (error) {
    console.error('LinkGuard: Error in checkLink:', error);
    showTooltip({
      url: link.href,
      status: 'error',
      message: 'Error analyzing link'
    }, x, y);
  }
}

/**
 * Show tooltip with link information
 * @param {Object} data - Link data
 * @param {number} x - Mouse X position
 * @param {number} y - Mouse Y position
 */
function showTooltip(data, x, y) {
  // Remove existing tooltip
  hideTooltip();
  
  // Create tooltip element
  const tooltip = document.createElement('div');
  tooltip.className = 'linkguard-tooltip';
  tooltip.id = 'linkguard-tooltip';
  
  // Determine status color
  let statusClass = 'safe';
  let statusText = 'Safe';
  
  if (data.status === 'loading') {
    statusClass = 'warning';
    statusText = 'Checking...';
  } else if (data.status === 'danger') {
    statusClass = 'danger';
    statusText = '⚠️ Suspicious';
  } else if (data.status === 'warning') {
    statusClass = 'warning';
    statusText = '⚠️ Caution';
  } else if (data.status === 'safe') {
    statusClass = 'safe';
    statusText = '✓ Safe';
  } else if (data.status === 'error') {
    statusClass = 'warning';
    statusText = 'Error';
  }
  
  // Build tooltip HTML
  tooltip.innerHTML = `
    <div class="linkguard-tooltip-header">
      <div class="linkguard-tooltip-status ${statusClass}"></div>
      <span class="linkguard-tooltip-title">${statusText}</span>
    </div>
    <div class="linkguard-tooltip-url">${truncateUrl(data.url, 50)}</div>
    <div class="linkguard-tooltip-info">${data.message || 'No issues detected'}</div>
  `;
  
  // Position tooltip
  tooltip.style.left = `${x + 15}px`;
  tooltip.style.top = `${y + 15}px`;
  
  // Add to page
  document.body.appendChild(tooltip);
  currentTooltip = tooltip;
  
  // Adjust position if off screen
  const rect = tooltip.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    tooltip.style.left = `${x - rect.width - 15}px`;
  }
  if (rect.bottom > window.innerHeight) {
    tooltip.style.top = `${y - rect.height - 15}px`;
  }
}

/**
 * Hide current tooltip
 */
function hideTooltip() {
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }
}

/**
 * Truncate URL for display
 * @param {string} url
 * @param {number} maxLength
 * @returns {string}
 */
function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

/**
 * Handle messages from background script
 * @param {Object} request
 * @param {Object} sender
 * @param {Function} sendResponse
 */
function handleMessage(request, sender, sendResponse) {
  if (request.action === 'updateTooltip') {
    // Update tooltip if still hovering
    if (currentTooltip) {
      showTooltip(request.data, request.x, request.y);
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
