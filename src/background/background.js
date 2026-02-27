// LinkGuard Background Service Worker
// Handles link analysis and extension logic

console.log('LinkGuard background service worker loaded');

const CONFIG = {
  cacheDuration: 24 * 60 * 60 * 1000, // 24 hours
  maxResponseTime: 100
};

const linkCache = new Map();

// ─── Known trusted domains ────────────────────────────────────────────────────
const KNOWN_DOMAINS = new Set([
  'google.com', 'microsoft.com', 'apple.com', 'amazon.com', 'paypal.com',
  'facebook.com', 'twitter.com', 'linkedin.com', 'github.com',
  'stackoverflow.com', 'youtube.com', 'wikipedia.org', 'reddit.com',
  'netflix.com', 'spotify.com', 'instagram.com', 'tiktok.com',
  'mozilla.org', 'w3.org', 'cloudflare.com', 'stripe.com',
]);

// Suspicious TLDs (commonly abused in phishing)
const SUSPICIOUS_TLDS = new Set([
  '.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.click',
  '.download', '.loan', '.work', '.men', '.date', '.review', '.stream',
]);

// Popular domains that are commonly typosquatted
const SQUATTABLE_DOMAINS = [
  'google', 'microsoft', 'apple', 'amazon', 'paypal', 'facebook',
  'twitter', 'linkedin', 'github', 'netflix', 'spotify', 'instagram',
  'youtube', 'gmail', 'outlook', 'dropbox', 'adobe', 'banking',
];

// URL shorteners
const SHORTENERS = new Set([
  'bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'ow.ly', 'short.link',
  'rb.gy', 'cutt.ly', 'is.gd', 'buff.ly',
]);

// Phishing keywords - only suspicious on NON-known domains
const PHISHING_KEYWORDS = [
  'verify', 'confirm', 'update', 'secure', 'login', 'signin',
  'account', 'banking', 'password', 'credential', 'validate',
];

// Homograph substitutions (lookalike characters used in IDN attacks)
const HOMOGRAPHS = {
  'a': ['а', 'ä', 'á', 'à'],  // Cyrillic а, etc.
  'e': ['е', 'ë', 'é'],        // Cyrillic е
  'o': ['о', 'ö', 'ó'],        // Cyrillic о
  'c': ['с'],                   // Cyrillic с
  'p': ['р'],                   // Cyrillic р
  'x': ['х'],                   // Cyrillic х
  'i': ['і', 'ï', 'í'],        // Cyrillic і
};

/**
 * Initialize background service
 */
function init() {
  console.log('LinkGuard: Background service initialized');
  clearOldCache();
  chrome.runtime.onMessage.addListener(handleMessage);
  chrome.alarms.create('cacheCleanup', { periodInMinutes: 60 });
  chrome.alarms.onAlarm.addListener(handleAlarm);
}

/**
 * Handle messages from content scripts and popup
 */
function handleMessage(request, sender, sendResponse) {
  console.log('LinkGuard: Received message:', request.action);

  if (request.action === 'checkLink') {
    checkLinkSafety(request.url)
      .then(result => sendResponse(result))
      .catch(error => {
        console.error('LinkGuard: Error checking link:', error);
        sendResponse({ url: request.url, status: 'error', message: 'Failed to check link safety' });
      });
    return true; // Keep channel open for async response
  }

  return false;
}

/**
 * Check link safety - main entry point
 */
async function checkLinkSafety(url) {
  const startTime = Date.now();

  try {
    // Check cache first
    const cached = getCachedResult(url);
    if (cached) {
      console.log(`LinkGuard: Cache hit (${Date.now() - startTime}ms)`);
      return cached;
    }

    const analysis = analyzeUrl(url);

    // Map threat level to status
    let status = 'safe';
    if (analysis.threatLevel === 'danger') status = 'danger';
    else if (analysis.threatLevel === 'warning') status = 'warning';

    const result = {
      url,
      status,
      message: analysis.message,
      details: analysis.details,
      score: analysis.score,
      checkedAt: Date.now()
    };

    cacheResult(url, result);
    console.log(`LinkGuard: Analysis done (${Date.now() - startTime}ms) score=${analysis.score}`);
    return result;

  } catch (error) {
    console.error('LinkGuard: Error in checkLinkSafety:', error);
    return { url, status: 'error', message: 'Failed to analyze link', checkedAt: Date.now() };
  }
}

/**
 * Analyze URL for suspicious patterns
 * Returns: { threatLevel, message, details, score }
 * Score: 0 = clean, higher = more suspicious
 */
function analyzeUrl(url) {
  const findings = [];  // Each finding: { severity, message }
  const details = {};

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    const fullUrl = url.toLowerCase();

    details.hostname = hostname;
    details.protocol = urlObj.protocol;

    // ── 1. Protocol check ─────────────────────────────────────────────────
    if (urlObj.protocol === 'http:') {
      findings.push({ severity: 'low', message: 'Connection is not encrypted (HTTP)' });
      details.https = false;
    } else {
      details.https = true;
    }

    // ── 2. IP address instead of domain ───────────────────────────────────
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      findings.push({ severity: 'high', message: 'Uses IP address instead of domain name' });
      details.usesIP = true;
    }

    // ── 3. Suspicious TLD ─────────────────────────────────────────────────
    const tld = '.' + hostname.split('.').slice(-1)[0];
    if (SUSPICIOUS_TLDS.has(tld)) {
      findings.push({ severity: 'medium', message: `Domain uses commonly abused TLD (${tld})` });
      details.suspiciousTLD = tld;
    }

    // ── 4. Excessive subdomains ───────────────────────────────────────────
    const domainParts = hostname.split('.');
    if (domainParts.length > 4) {
      findings.push({ severity: 'medium', message: `Unusual subdomain depth (${domainParts.length} levels)` });
      details.subdomainDepth = domainParts.length;
    }

    // ── 5. Typosquatting detection ────────────────────────────────────────
    const baseDomain = domainParts.slice(-2).join('.');
    const registeredName = domainParts.slice(-2, -1)[0]; // e.g. "paypa1" from "paypa1.com"

    for (const target of SQUATTABLE_DOMAINS) {
      if (registeredName !== target && levenshtein(registeredName, target) <= 2 && !isKnownDomain(hostname)) {
        findings.push({ severity: 'high', message: `Domain resembles "${target}.com" - possible typosquatting` });
        details.typosquatTarget = target;
        break;
      }
    }

    // ── 6. Known domain check (trust signal) ──────────────────────────────
    const trusted = isKnownDomain(hostname);
    details.trusted = trusted;

    // ── 7. Phishing keywords (only on unknown domains) ────────────────────
    if (!trusted) {
      const foundKeywords = PHISHING_KEYWORDS.filter(kw => fullUrl.includes(kw));
      if (foundKeywords.length > 0) {
        findings.push({ severity: 'medium', message: `Contains sensitive keywords: ${foundKeywords.join(', ')}` });
        details.phishingKeywords = foundKeywords;
      }
    }

    // ── 8. Homograph attack detection ────────────────────────────────────
    if (hasHomographChars(hostname)) {
      findings.push({ severity: 'high', message: 'Domain contains lookalike characters (possible IDN homograph attack)' });
      details.homograph = true;
    }

    // ── 9. URL entropy (high entropy = possible DGA/random domain) ────────
    const domainEntropy = shannonEntropy(registeredName);
    if (domainEntropy > 3.8 && !trusted && registeredName.length > 8) {
      findings.push({ severity: 'medium', message: 'Domain name has unusual character pattern' });
      details.highEntropy = domainEntropy.toFixed(2);
    }

    // ── 10. Excessive URL length ──────────────────────────────────────────
    if (url.length > 200) {
      findings.push({ severity: 'low', message: `Unusually long URL (${url.length} characters)` });
      details.longUrl = url.length;
    }

    // ── 11. URL shortener ─────────────────────────────────────────────────
    if (SHORTENERS.has(hostname)) {
      findings.push({ severity: 'low', message: 'Shortened URL - real destination is hidden' });
      details.shortened = true;
    }

    // ── 12. Multiple redirects in URL (common in phishing) ───────────────
    const redirectPattern = /(https?:\/\/.*){2,}/i;
    if (redirectPattern.test(url)) {
      findings.push({ severity: 'medium', message: 'URL contains embedded redirect' });
      details.embeddedRedirect = true;
    }

    // ── Calculate score and threat level ──────────────────────────────────
    const score = calculateScore(findings);
    const threatLevel = scoreToThreatLevel(score);

    // Build human-readable message
    const message = buildMessage(findings, trusted);

    return { threatLevel, message, details, score, findings };

  } catch (error) {
    console.error('Error analyzing URL:', error);
    return {
      threatLevel: 'warning',
      message: 'Could not fully analyze this URL',
      details: { error: error.message },
      score: 10
    };
  }
}

/**
 * Calculate risk score from findings
 */
function calculateScore(findings) {
  const weights = { high: 40, medium: 20, low: 5 };
  return findings.reduce((sum, f) => sum + (weights[f.severity] || 0), 0);
}

/**
 * Map score to threat level
 */
function scoreToThreatLevel(score) {
  if (score >= 40) return 'danger';
  if (score >= 20) return 'warning';
  return 'safe';
}

/**
 * Build human-readable message from findings
 */
function buildMessage(findings, trusted) {
  if (findings.length === 0) return 'No issues detected';

  // Show most severe finding first
  const sorted = [...findings].sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    return order[a.severity] - order[b.severity];
  });

  if (sorted.length === 1) return sorted[0].message;

  const top = sorted[0].message;
  const rest = sorted.length - 1;
  return `${top} (+${rest} more issue${rest > 1 ? 's' : ''})`;
}

/**
 * Check if domain is known/trusted
 */
function isKnownDomain(hostname) {
  for (const domain of KNOWN_DOMAINS) {
    if (hostname === domain || hostname.endsWith('.' + domain)) return true;
  }
  return false;
}

/**
 * Levenshtein distance between two strings
 * Used for typosquatting detection
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Shannon entropy of a string
 * High entropy = random-looking domain (possible DGA malware)
 */
function shannonEntropy(str) {
  const freq = {};
  for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
  return Object.values(freq).reduce((entropy, count) => {
    const p = count / str.length;
    return entropy - p * Math.log2(p);
  }, 0);
}

/**
 * Check for homograph characters in hostname
 * IDN homograph attack: payраl.com (Cyrillic а, р)
 */
function hasHomographChars(hostname) {
  // Punycode domains start with "xn--" - always flag those for review
  if (hostname.includes('xn--')) return true;

  // Check for mixed scripts (Latin + Cyrillic)
  const hasCyrillic = /[\u0400-\u04FF]/.test(hostname);
  const hasLatin = /[a-z]/.test(hostname);
  return hasCyrillic && hasLatin;
}

// ─── Cache ────────────────────────────────────────────────────────────────────

function getCachedResult(url) {
  const cached = linkCache.get(url);
  if (!cached) return null;
  if (Date.now() - cached.checkedAt > CONFIG.cacheDuration) {
    linkCache.delete(url);
    return null;
  }
  return cached;
}

function cacheResult(url, result) {
  linkCache.set(url, result);
  if (linkCache.size > 1000) {
    const entries = Array.from(linkCache.entries())
      .sort((a, b) => a[1].checkedAt - b[1].checkedAt);
    entries.slice(0, 100).forEach(([key]) => linkCache.delete(key));
  }
}

function clearOldCache() {
  const now = Date.now();
  for (const [url, result] of linkCache.entries()) {
    if (now - result.checkedAt > CONFIG.cacheDuration) linkCache.delete(url);
  }
  console.log(`LinkGuard: Cache cleaned, ${linkCache.size} entries remaining`);
}

function handleAlarm(alarm) {
  if (alarm.name === 'cacheCleanup') clearOldCache();
}

// Initialize
init();
