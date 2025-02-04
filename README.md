# Rust-Tauri Application Template

A production-ready template for creating cross-platform desktop applications with:

- **Tauri**: 2.0.5
- **Rust**: 1.64.0 (minimum)
- **Node.js**: 18.12.1

## Features
- Preconfigured Tauri setup
- Example IPC communication
- Opener plugin integration
- Development/production build scripts

## Prerequisites
- Rust (install via rustup)
- Node.js 18+
- Tauri CLI (`npm install -g @tauri-apps/cli`)

## Getting Started
```bash
git clone https://github.com/yourusername/rust-tauri-template
cd rust-tauri-template
npm install
npm run tauri dev
```

## Project Structure
```
├── src-tauri/      # Rust backend
├── src/            # Frontend code
├── package.json    # Node dependencies (Tauri v2)
└── Cargo.toml      # Rust dependencies
```

## Building
```bash
npm run tauri build  # Production build
```

⚠️ **Template Note**: Remember to:
1. Rename app in `tauri.conf.json`
2. Update application metadata
3. Modify LICENSE file
