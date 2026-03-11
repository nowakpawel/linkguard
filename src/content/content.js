// LinkGuard Content Script
// Injected into every web page to detect and analyze links

console.log('LinkGuard content script loaded');

// State
let currentTooltip = null;
let hoveredLink = null;
let checkTimeout = null;
let hideTimeout = null;

/**
 * Inject CSS for the expanded URL row.
 * Done in JS so the style travels with this single file.
 */
function injectExpandedStyles() {
  if (document.getElementById('linkguard-expanded-style')) return;
  const style = document.createElement('style');
  style.id = 'linkguard-expanded-style';
  style.textContent = `
    .linkguard-tooltip-expanded {
      display: flex !important;
      flex-direction: column !important;
      gap: 2px !important;
      margin: 4px 0 6px !important;
      padding: 6px 8px !important;
      background: #eff6ff !important;
      border-radius: 4px !important;
      border-left: 3px solid #3b82f6 !important;
    }
    .linkguard-tooltip-expanded-label {
      font-size: 10px !important;
      font-weight: 700 !important;
      letter-spacing: 0.05em !important;
      text-transform: uppercase !important;
      color: #2563eb !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
    .linkguard-tooltip-expanded-url {
      font-size: 11px !important;
      color: #1e40af !important;
      word-break: break-all !important;
      line-height: 1.4 !important;
      font-family: 'Monaco', 'Menlo', 'Courier New', monospace !important;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Initialize content script
 */
function init() {
  console.log('LinkGuard: Initializing content script');
  injectExpandedStyles();
  setupLinkDetection();
  chrome.runtime.onMessage.addListener(handleMessage);
}

/**
 * Set up link hover detection
 */
function setupLinkDetection() {
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('mouseout', handleMouseOut, true);
  document.addEventListener('scroll', handleScroll, true);
}

/**
 * Handle mouse over event
 */
function handleMouseOver(event) {
  const link = event.target.closest('a');

  if (!link || !link.href) return;
  if (hoveredLink === link) return;

  // Cancel any pending hide
  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  hoveredLink = link;

  if (checkTimeout) {
    clearTimeout(checkTimeout);
  }

  checkTimeout = setTimeout(() => {
    checkLink(link, event.clientX, event.clientY);
  }, 300);
}

/**
 * Handle mouse out event
 * BUG FIX: Check relatedTarget to avoid hiding when mouse moves
 * between child elements of the same link (e.g. <a><span>text</span></a>)
 */
function handleMouseOut(event) {
  const link = event.target.closest('a');

  if (!link || link !== hoveredLink) return;

  // If mouse moved to a child element of the SAME link - ignore
  const relatedTarget = event.relatedTarget;
  if (relatedTarget && link.contains(relatedTarget)) return;

  hoveredLink = null;

  if (checkTimeout) {
    clearTimeout(checkTimeout);
    checkTimeout = null;
  }

  // Small delay before hiding - prevents flicker when mouse briefly
  // passes through link border
  hideTimeout = setTimeout(() => {
    hideTooltip();
    hideTimeout = null;
  }, 100);
}

/**
 * Handle scroll event
 */
function handleScroll() {
  if (currentTooltip) {
    hideTooltip();
  }
}

/**
 * Check a link's safety
 */
async function checkLink(link, x, y) {
  try {
    const url = link.href;
    console.log('LinkGuard: Checking link:', url);

    showTooltip({
      url: url,
      status: 'loading',
      message: 'Checking link safety...'
    }, x, y);

    chrome.runtime.sendMessage({ action: 'checkLink', url: url }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('LinkGuard: Runtime error:', chrome.runtime.lastError);
        if (hoveredLink === link) {
          showTooltip({ url, status: 'error', message: 'Failed to check link' }, x, y);
        }
        return;
      }

      if (!response) {
        if (hoveredLink === link) {
          showTooltip({ url, status: 'error', message: 'No response from analysis' }, x, y);
        }
        return;
      }

      // Only update if still hovering the same link
      if (hoveredLink === link) {
        showTooltip(response, x, y);
      }
    });

    chrome.runtime.sendMessage({ action: 'linkChecked' });

  } catch (error) {
    console.error('LinkGuard: Error in checkLink:', error);
    showTooltip({ url: link.href, status: 'error', message: 'Error analyzing link' }, x, y);
  }
}

/**
 * Show tooltip with link information
 */
function showTooltip(data, x, y) {
  hideTooltip();

  const tooltip = document.createElement('div');
  tooltip.className = 'linkguard-tooltip';
  tooltip.id = 'linkguard-tooltip';

  // Tooltip must not intercept mouse events — would block mouseout on the link
  tooltip.style.pointerEvents = 'none';

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

  // Build expanded URL row (only for shortened links where we resolved the real URL)
  const expandedRow = data.expandedUrl
    ? `<div class="linkguard-tooltip-expanded">
         <span class="linkguard-tooltip-expanded-label">↪ Real destination</span>
         <span class="linkguard-tooltip-expanded-url">${truncateUrl(data.expandedUrl, 55)}</span>
       </div>`
    : '';

  tooltip.innerHTML = `
    <div class="linkguard-tooltip-header">
      <div class="linkguard-tooltip-status ${statusClass}"></div>
      <span class="linkguard-tooltip-title">${statusText}</span>
    </div>
    <div class="linkguard-tooltip-url">${truncateUrl(data.url, 50)}</div>
    ${expandedRow}
    <div class="linkguard-tooltip-info">${data.message || 'No issues detected'}</div>
  `;

  tooltip.style.left = `${x + 15}px`;
  tooltip.style.top = `${y + 15}px`;

  document.body.appendChild(tooltip);
  currentTooltip = tooltip;

  // Adjust position if tooltip goes off screen
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
 */
function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

/**
 * Handle messages from background script
 */
function handleMessage(request, sender, sendResponse) {
  if (request.action === 'updateTooltip' && currentTooltip) {
    showTooltip(request.data, request.x, request.y);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
