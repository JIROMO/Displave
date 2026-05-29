# Displave

[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![release](https://img.shields.io/github/v/release/JIROMO/Displave)](https://github.com/JIROMO/Displave/releases)
[![downloads](https://img.shields.io/github/downloads/JIROMO/Displave/total)](https://github.com/JIROMO/Displave/releases)
[![build](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![website](https://img.shields.io/badge/website-displave.com-blue)](https://displave.com)
[![docs](https://img.shields.io/badge/docs-日本語-lightgrey)](https://displave.com)
[![docs](https://img.shields.io/badge/docs-English-lightgrey)](https://displave.com/en.html)

**Your workspace, one click away.**

Displave is a macOS menu bar app that saves and applies window layouts instantly. Switch between work modes without rearranging windows every time.

---

## Features

- **Save any layout** — Capture the position and size of every open window with one click
- **Apply instantly** — Windows snap back to exactly where you left them
- **Window ordering** — Preserves z-order, not just position and size
- **Keyboard shortcut** — `⌘⇧S` to save without touching the mouse
- **Multi-display** — Tracks which display each window belongs to
- **Menu bar only** — No dock icon, no distractions

## Requirements

- macOS 13 Ventura or later
- Apple Silicon
- Accessibility permission

## Download

[Download Displave v0.1.0](https://github.com/JIROMO/Displave/releases/download/v0.1.0/Displave-0.1.0-arm64.dmg)

## Usage

1. **Install** — Open the DMG and drag Displave to Applications
2. **Grant permission** — System Settings → Privacy & Security → Accessibility → enable Displave
3. **Save a layout** — Arrange your windows, then click the menu bar icon → **Save Layout** (or `⌘⇧S`)
4. **Apply a layout** — Click the menu bar icon → hover over a saved layout → **Apply**
5. **Delete a layout** — Hover over a layout → **Delete**

## Development

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build DMG
npm run build
```

## License

MIT
