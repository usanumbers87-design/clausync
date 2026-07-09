# All Commands Used During Development

## Initial Setup
```bash
git clone https://github.com/caamer20/Telegram-Drive /tmp/ausync-build/
# Rebranding: find/replace "Telegram Drive" -> "AuSync", "com.cameronamer" -> "com.darkinlife71"
git init && git add -A && git commit -m "Initial rebrand from Telegram Drive to AuSync"
git remote add origin https://github.com/darkinlife71/ausync.git
git push -u origin main
```

## Signing Key
```bash
npx @tauri-apps/cli signer generate
# Set TAURI_SIGNING_PRIVATE_KEY and TAURI_SIGNING_PRIVATE_KEY_PASSWORD as GitHub secrets
```

## Ad Removal (v1.0.3)
```bash
rm src/components/shared/AdsterraBanner.tsx src/components/shared/AdGateway.tsx src/components/desktop/dashboard/DesktopAdBanner.tsx
# Edited src/App.tsx, DesktopDashboard.tsx, MobileDashboard.tsx, SettingsModal.tsx, tauri.conf.json
npx tsc --noEmit   # verify no TS errors
npx vite build      # verify frontend builds
git add -A && git commit -m "remove all ad code" && git push
git tag v1.0.3 && git push origin v1.0.3
```

## Android Support (v1.0.4)
```bash
# Install Java 17
curl -sL "https://cdn.azul.com/zulu/bin/zulu17.52.17-ca-jdk17.0.12-linux_x64.tar.gz" -o /tmp/zulu.tar.gz
tar xzf /tmp/zulu.tar.gz -C /tmp
export JAVA_HOME="/tmp/zulu17.52.17-ca-jdk17.0.12-linux_x64"

# Set up Android SDK
curl -o /tmp/android-sdk/cmdline-tools.zip "https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip"
/tmp/android-sdk/cmdline-tools/latest/bin/sdkmanager --sdk_root=/tmp/android-sdk "platforms;android-34" "build-tools;34.0.0" "ndk;27.0.12077973"
```

## CI Build Tags
```bash
git tag v1.0.0 && git push origin v1.0.0
git tag v1.0.1 && git push origin v1.0.1
git tag v1.0.2 && git push origin v1.0.2
git tag v1.0.3 && git push origin v1.0.3
git tag v1.0.4 && git push origin v1.0.4
```
