# LinkGuard

**Privacy-first browser extension that checks link safety before you click.**

🔒 Zero tracking | ⚡ Sub-100ms response | 🌐 Open-source | 🛡️ Real-time analysis

---

## 🎯 What is LinkGuard?

LinkGuard protects you from clicking dangerous links by analyzing them in real-time. Simply hover over any link to see:

- ✅ **Safety rating** (Safe / Caution / Suspicious)
- ✅ **Real destination** URL
- ✅ **Security warnings** (HTTP vs HTTPS, suspicious domains, phishing keywords)
- ✅ **Instant analysis** in under 100ms

All analysis happens **before you click** - giving you the information you need to browse safely.

---

## 🚀 Installation

**Chrome Web Store:** *Coming soon!* (Chrome Web Store submission in progress)

For now, see [Development Setup](#-development-setup) to run from source.

---

## ✨ Features

### Current (v0.1.0)

**Core Protection:**
- ✅ Hover detection on all links
- ✅ Real-time safety analysis
- ✅ Pattern-based threat detection (suspicious TLDs, phishing keywords, IP addresses)
- ✅ HTTPS vs HTTP checking
- ✅ Beautiful tooltip interface
- ✅ Statistics tracking
- ✅ Smart caching (sub-100ms for repeated checks)
- ✅ Privacy-first (zero tracking, local analysis)

### Coming Soon

- 🔜 Google Safe Browsing API integration
- 🔜 URL expansion for shortened links (bit.ly, tinyurl, etc.)
- 🔜 Multi-API verification (VirusTotal, PhishTank)
- 🔜 Domain age checking
- 🔜 SSL certificate validation
- 🔜 Settings page with customization options
- 🔜 Cross-browser support (Firefox, Safari, Edge)

### Planned Premium Features

- 🔜 Advanced threat intelligence (multiple APIs)
- 🔜 Link screenshot preview
- 🔜 Historical threat data
- 🔜 Custom whitelist/blacklist
- 🔜 Advanced analytics dashboard
- 🔜 Unlimited checks (free tier: 1,000/month)

---

## 🛠️ Tech Stack

**Extension:**
- Vanilla JavaScript (no frameworks for speed)
- Chrome Extension Manifest V3
- Content scripts + Background service worker
- Local storage (privacy-first)

**Current Analysis:**
- Pattern-based detection (suspicious TLDs, keywords, protocols)
- Smart caching system (24-hour cache, sub-100ms responses)

**Planned Integrations:**
- Google Safe Browsing API (10K requests/day free)
- WHOIS lookup (domain age)
- SSL Labs (certificate checking)

**Future Backend (Premium):**
- Node.js/Express (Vercel)
- PostgreSQL (Supabase)
- Redis cache (Upstash)

---

## 💻 Development Setup

**For Contributors & Developers:**

### Prerequisites
- Chrome/Chromium browser
- Git
- Text editor (VS Code recommended)

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/nowakpwel/linkguard.git
cd linkguard
```

2. **Load extension in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the repository folder
   - LinkGuard icon appears in toolbar!

3. **Test it:**
   - Visit any website (github.com, reddit.com, etc.)
   - Hover over any link
   - See LinkGuard tooltip appear with safety information!

4. **Open console for debugging:**
   - Right-click extension icon → "Inspect popup" (for popup debugging)
   - Press F12 on any webpage → Console tab (for content script logs)
   - chrome://extensions/ → Click "service worker" (for background script logs)

---

## 📂 Project Structure

```
linkguard/extension/
├── manifest.json              # Extension configuration
├── README.md                  # This file
├── LICENSE                    # MIT License
│
├── src/
│   ├── popup/                 # Extension popup UI
│   │   ├── popup.html
│   │   ├── popup.css
│   │   └── popup.js
│   │
│   ├── content/               # Injected into web pages
│   │   ├── content.js
│   │   └── content.css
│   │
│   ├── background/            # Service worker
│   │   └── background.js
│   │
│   ├── utils/                 # Shared utilities
│   │   ├── api.js            # API integrations
│   │   └── urlParser.js      # URL analysis
│   │
│   └── assets/                # Icons and images
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
│
└── docs/                      # Documentation
    ├── ARCHITECTURE.md
    └── CONTRIBUTING.md
```

---

## 🐛 Debugging & Development Tips

### Console Access

**Popup console:**
- Right-click extension icon → "Inspect popup"

**Content script console:**
- Press F12 on any webpage → Console tab
- Look for messages starting with "LinkGuard:"

**Background service worker console:**
- Go to chrome://extensions/
- Click "service worker" link under LinkGuard
- (Note: Service worker sleeps when inactive - hover over a link to wake it up)

### Common Issues

**Extension doesn't load:**
- Check that manifest.json is in the root folder
- Look for red "Errors" button in chrome://extensions/
- Verify all required files are present (see Project Structure below)

**Tooltip doesn't appear:**
- Refresh the webpage (Ctrl+R / Cmd+R)
- Check console for JavaScript errors
- Ensure you hover for at least 300ms (prevents flashing)
- Verify content.css is loading

**Tooltip stuck on "Checking...":**
- Open background service worker console
- Check for errors in message passing
- Verify background.js is running

### Testing Tips

- **Test on multiple sites:** github.com, reddit.com, news sites
- **Test different link types:** HTTPS, HTTP, IP addresses, suspicious domains
- **Check performance:** Console shows response times for each check
- **Try edge cases:** Very long URLs, special characters, malformed links

---

## 🤝 Contributing

LinkGuard is open-source and welcomes contributions!

**Ways to help:**
- 🐛 Report bugs
- 💡 Suggest features
- 🔧 Submit pull requests
- 📖 Improve documentation
- ⭐ Star the repo!

See [CONTRIBUTING.md](docs/CONTRIBUTING.md) for guidelines.

---

## 🔒 Privacy Commitment

**LinkGuard is privacy-first by design:**
- ✅ **Zero tracking** - No analytics, no telemetry
- ✅ **Zero data collection** - Links checked locally when possible
- ✅ **Open-source** - Full transparency, audit our code
- ✅ **No user accounts** - Works immediately, no signup
- ✅ **Minimal permissions** - Only what's necessary

When we call external APIs (Google Safe Browsing, etc.), we send only the URL hash, never your full browsing history.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🌐 Links

- **Website:** [linkguard.dev](https://linkguard.dev)
- **GitHub:** [github.com/nowakpwel/linkguard](https://github.com/nowakpwel/linkguard)
- **Issues:** [Report a bug](https://github.com/nowakpwel/linkguard/issues)
- **Discussions:** [Join the conversation](https://github.com/nowakpwel/linkguard/discussions)

---

## 👨‍💻 Author

**Pawel Nowak** ([@nowakpwel](https://github.com/nowakpwel))
- 🌍 Based in Wrocław, Poland
- 💼 Java Developer | Privacy Advocate
- 🔗 [LinkedIn](https://www.linkedin.com/in/nowakpwel)

---

## 📊 Roadmap

### ✅ v0.1.0 (Current - MVP Complete!)
- ✅ Hover detection working
- ✅ Real-time analysis
- ✅ Tooltip interface
- ✅ Pattern-based threat detection
- ✅ Statistics tracking
- ✅ Sub-100ms response time

### 🔜 v0.2.0
- [ ] Google Safe Browsing API integration
- [ ] URL expansion for shortened links
- [ ] Improved threat detection accuracy
- [ ] Settings page with preferences

### 🔜 v0.3.0 - Chrome Web Store Launch
- [ ] Complete UI polish
- [ ] Performance optimization
- [ ] Beta testing with 50+ users
- [ ] Chrome Web Store submission
- [ ] First public release!

### 🔜 v1.0.0 - Premium Features
- [ ] Multi-API verification (VirusTotal, PhishTank)
- [ ] Advanced analytics dashboard
- [ ] Custom whitelist/blacklist
- [ ] Business tier

### 🔜 v2.0.0 -  Cross-platform
- [ ] Firefox extension
- [ ] Safari extension
- [ ] Edge extension

---

**⭐ Star this repo if you want safer browsing!**

**🚀 Built in public - follow the journey!**

---

*Last updated: December 4, 2024*
