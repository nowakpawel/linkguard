// LinkGuard Background Service Worker
// Handles API calls, link analysis, and extension logic

console.log('LinkGuard background service worker loaded');

// Configuration
const CONFIG = {
  // API endpoints
  safeBrowsingAPI: 'https://safebrowsing.googleapis.com/v4/threatMatches:find',
  // Add more APIs here as we integrate them
  
  // Cache duration (24 hours)
  cacheDuration: 24 * 60 * 60 * 1000,
  
  // Response time target
  maxResponseTime: 100 // milliseconds
};

// In-memory cache for checked links
const linkCache = new Map();

/**
 * Initialize background service
 */
function init() {
  console.log('LinkGuard: Background service initialized');
  
  // Clear old cache on startup
  clearOldCache();
  
  // Set up message listeners
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Set up alarm for periodic cache cleanup
  chrome.alarms.create('cacheCleanup', { periodInMinutes: 60 });
  chrome.alarms.onAlarm.addListener(handleAlarm);
}

/**
 * Handle messages from content scripts and popup
 * @param {Object} request
 * @param {Object} sender
 * @param {Function} sendResponse
 * @returns {boolean} - Keep channel open for async response
 */
function handleMessage(request, sender, sendResponse) {
  console.log('LinkGuard: Received message:', request.action);
  
  if (request.action === 'checkLink') {
    // Handle async response
    checkLinkSafety(request.url)
      .then(result => {
        console.log('LinkGuard: Sending result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('LinkGuard: Error checking link:', error);
        sendResponse({
          url: request.url,
          status: 'error',
          message: 'Failed to check link safety'
        });
      });
    return true; // CRITICAL: Keep channel open for async response
  }
  
  if (request.action === 'linkChecked' || request.action === 'threatBlocked') {
    // No response needed
    return false;
  }
  
  console.warn('LinkGuard: Unknown action:', request.action);
  return false;
}

/**
 * Check link safety
 * @param {string} url
 * @returns {Promise<Object>}
 */
async function checkLinkSafety(url) {
  const startTime = Date.now();
  
  try {
    console.log('LinkGuard: Starting analysis for:', url);
    
    // Check cache first
    const cached = getCachedResult(url);
    if (cached) {
      console.log('LinkGuard: Using cached result for:', url);
      const responseTime = Date.now() - startTime;
      console.log(`LinkGuard: Response time: ${responseTime}ms (cached)`);
      return cached;
    }
    
    // Parse and analyze URL
    console.log('LinkGuard: Analyzing URL patterns...');
    const analysis = analyzeUrl(url);
    console.log('LinkGuard: Analysis complete:', analysis);
    
    // For MVP: Simple analysis without API calls
    // TODO: Add Google Safe Browsing API integration
    const result = {
      url: url,
      status: analysis.suspicious ? 'warning' : 'safe',
      message: analysis.message,
      details: analysis.details,
      checkedAt: Date.now()
    };
    
    console.log('LinkGuard: Final result:', result);
    
    // Cache the result
    cacheResult(url, result);
    
    const responseTime = Date.now() - startTime;
    console.log(`LinkGuard: Response time: ${responseTime}ms`);
    
    // Warn if response time exceeds target
    if (responseTime > CONFIG.maxResponseTime) {
      console.warn(`LinkGuard: Response time ${responseTime}ms exceeds target ${CONFIG.maxResponseTime}ms`);
    }
    
    return result;
    
  } catch (error) {
    console.error('LinkGuard: Error in checkLinkSafety:', error);
    return {
      url: url,
      status: 'error',
      message: 'Failed to analyze link',
      checkedAt: Date.now()
    };
  }
}

/**
 * Analyze URL for suspicious patterns
 * @param {string} url
 * @returns {Object}
 */
function analyzeUrl(url) {
  const details = {};
  let suspicious = false;
  const warnings = [];
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (urlObj.protocol === 'http:') {
      warnings.push('Not using HTTPS');
      details.https = false;
    } else {
      details.https = true;
    }
    
    // Check for IP address instead of domain
    const ipPattern = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
    if (ipPattern.test(url)) {
      warnings.push('Using IP address instead of domain name');
      suspicious = true;
      details.usesIP = true;
    }
    
    // Check for suspicious TLDs
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top'];
    const hasSuspiciousTLD = suspiciousTLDs.some(tld => urlObj.hostname.endsWith(tld));
    if (hasSuspiciousTLD) {
      warnings.push('Domain uses commonly abused TLD');
      suspicious = true;
      details.suspiciousTLD = true;
    }
    
    // Check for excessive subdomains
    const parts = urlObj.hostname.split('.');
    if (parts.length > 4) {
      warnings.push('Unusual number of subdomains');
      suspicious = true;
      details.manySubdomains = true;
    }
    
    // Check for suspicious keywords in URL
    const suspiciousKeywords = ['login', 'verify', 'account', 'secure', 'update', 'confirm', 'banking', 'paypal', 'amazon', 'microsoft'];
    const hasKeyword = suspiciousKeywords.some(keyword => url.toLowerCase().includes(keyword));
    if (hasKeyword && !isKnownDomain(urlObj.hostname)) {
      warnings.push('Contains sensitive keywords');
      suspicious = true;
      details.suspiciousKeywords = true;
    }
    
    // Check for URL shorteners (we'll expand these later)
    const shorteners = ['bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'ow.ly', 'short.link'];
    const isShortened = shorteners.some(s => urlObj.hostname.includes(s));
    if (isShortened) {
      warnings.push('Shortened URL - destination unknown');
      details.shortened = true;
      // Not marking as suspicious since many legitimate uses
    }
    
    // Build message
    let message = '';
    if (warnings.length > 0) {
      message = warnings.join('. ');
    } else {
      message = 'No obvious issues detected';
    }
    
    details.hostname = urlObj.hostname;
    details.protocol = urlObj.protocol;
    
    return {
      suspicious,
      message,
      details
    };
    
  } catch (error) {
    console.error('Error analyzing URL:', error);
    return {
      suspicious: true,
      message: 'Invalid or malformed URL',
      details: { error: error.message }
    };
  }
}

/**
 * Check if domain is known/trusted
 * @param {string} hostname
 * @returns {boolean}
 */
function isKnownDomain(hostname) {
  // List of known legitimate domains
  // TODO: Expand this list or use a reputation database
  const knownDomains = [
    'google.com',
    'microsoft.com',
    'apple.com',
    'amazon.com',
    'paypal.com',
    'facebook.com',
    'twitter.com',
    'linkedin.com',
    'github.com',
    'stackoverflow.com'
  ];
  
  return knownDomains.some(domain => hostname.endsWith(domain));
}

/**
 * Get cached result for URL
 * @param {string} url
 * @returns {Object|null}
 */
function getCachedResult(url) {
  const cached = linkCache.get(url);
  
  if (!cached) return null;
  
  // Check if cache is still valid
  const age = Date.now() - cached.checkedAt;
  if (age > CONFIG.cacheDuration) {
    linkCache.delete(url);
    return null;
  }
  
  return cached;
}

/**
 * Cache result for URL
 * @param {string} url
 * @param {Object} result
 */
function cacheResult(url, result) {
  linkCache.set(url, result);
  
  // Limit cache size
  if (linkCache.size > 1000) {
    // Remove oldest entries
    const entries = Array.from(linkCache.entries());
    entries.sort((a, b) => a[1].checkedAt - b[1].checkedAt);
    
    // Remove oldest 100 entries
    for (let i = 0; i < 100; i++) {
      linkCache.delete(entries[i][0]);
    }
  }
}

/**
 * Clear old cache entries
 */
function clearOldCache() {
  const now = Date.now();
  
  for (const [url, result] of linkCache.entries()) {
    const age = now - result.checkedAt;
    if (age > CONFIG.cacheDuration) {
      linkCache.delete(url);
    }
  }
  
  console.log(`LinkGuard: Cache cleaned, ${linkCache.size} entries remaining`);
}

/**
 * Handle alarm events
 * @param {Object} alarm
 */
function handleAlarm(alarm) {
  if (alarm.name === 'cacheCleanup') {
    clearOldCache();
  }
}

// Initialize
init();
