# Key Facts About AuSync

## Identity
- **App Name:** AuSync
- **Bundle ID:** com.darkinlife71.ausync
- **GitHub:** github.com/darkinlife71/ausync
- **Based on:** Telegram Drive (Tauri v2, MIT license)

## GitHub Access
- **PAT:** (redacted — stored in _opencode-history/COMMANDS.md on local machine only)
- **Secrets:** TAURI_SIGNING_PRIVATE_KEY, TAURI_SIGNING_PRIVATE_KEY_PASSWORD

## Build
- CI builds on tag push (v*)
- Platforms: Windows (exe), Linux (AppImage/deb/rpm), macOS x64 (dmg), macOS ARM (dmg), Android (apk)
- Release URL pattern: https://github.com/darkinlife71/ausync/releases/tag/v{version}
- Setup download: https://github.com/darkinlife71/ausync/releases/download/v1.0.3/AuSync_1.0.0_x64-setup.exe

## Features
- Telegram file manager (upload/download/stream)
- Adaptive polling sync (configurable 10-120s intervals)
- Media player with video/audio streaming
- File search, folders, bulk share
- Auto-update via Tauri updater plugin
- Dark/light theme, custom themes
- Performance mode
- Multiple language support (i18n)

## Smart Screen Warning
- Unsigned EXE will show "Windows protected your PC" — unavoidable without code signing cert ($200-300/yr)
- User should click "More info" → "Run anyway"
- OR use the MSI installer instead

## Source Locations
- Primary: /tmp/ausync-build/ (full repo with .github)
- App source: /tmp/ausync-build/app/
- Linux desktop: ~/Desktop/ausync-source/
- Windows desktop: /mnt/c/Users/admin/Desktop/ausync-source/
- GitHub: https://github.com/darkinlife71/ausync
