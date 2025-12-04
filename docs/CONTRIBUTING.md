# Contributing to LinkGuard

First off, thank you for considering contributing to LinkGuard! It's people like you that make LinkGuard a great tool for protecting privacy and security online.

## 🌟 How Can I Contribute?

### Reporting Bugs

Bugs are tracked as GitHub issues. When creating a bug report, please include:

- **Clear title and description**
- **Steps to reproduce** the problem
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Browser version** and OS
- **Extension version**

### Suggesting Features

Feature suggestions are welcome! Please include:

- **Clear use case**: Why is this feature needed?
- **Proposed solution**: How should it work?
- **Alternatives considered**: What other approaches did you think about?

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes**
3. **Test thoroughly** - ensure the extension still works
4. **Update documentation** if needed
5. **Follow the code style** (see below)
6. **Submit a pull request**

## 💻 Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/linkguard.git
cd linkguard/extension

# Load in Chrome
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the extension folder
```

## 📝 Code Style

- **JavaScript**: Use ES6+ features
- **Indentation**: 2 spaces
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: Explain "why", not "what"
- **Console logs**: Use for development, remove before PR

### Example:
```javascript
/**
 * Check if URL is safe
 * @param {string} url - URL to check
 * @returns {Promise<Object>} Safety result
 */
async function checkUrl(url) {
  // Implementation
}
```

## 🧪 Testing

Before submitting a PR, test:

1. **Basic functionality**: Hover over links on various websites
2. **Performance**: Check response times
3. **Edge cases**: Try malformed URLs, very long URLs, etc.
4. **Cross-browser**: Test on Chrome, Edge if possible

## 🔒 Security

- **Never commit API keys** or sensitive data
- **Report security issues privately** to the maintainer
- **Follow privacy principles**: Zero tracking, minimal permissions

## 📋 Commit Messages

- Use present tense ("Add feature" not "Added feature")
- Be descriptive but concise
- Reference issues: "Fix #123: Description"

### Examples:
```
Add hover tooltip animation
Fix cache cleanup memory leak
Update README with installation steps
```

## 🎯 Priority Areas

Current development priorities:

1. **Google Safe Browsing API integration**
2. **URL expansion for shorteners**
3. **Performance optimization** (<100ms target)
4. **Premium features** (multi-API, analytics)
5. **Firefox/Safari support**

## 📜 Code of Conduct

- **Be respectful** and constructive
- **Welcome newcomers** and help them get started
- **Focus on code quality**, not quantity
- **Privacy first**: Always consider user privacy

## ❓ Questions?

- **Open an issue** for general questions
- **Check existing issues** before creating new ones
- **Join discussions** in GitHub Discussions

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for making the internet safer! 🛡️**

*Last updated: November 18, 2024*
