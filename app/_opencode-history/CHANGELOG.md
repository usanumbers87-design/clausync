# AuSync Development History

## v1.0.4 — Android support added
- Ran `npx tauri android init` to scaffold Android project
- Generated Android launcher icons from logo SVG via cairosvg
- Updated `.github/workflows/release.yml` with `build-android` job (uses `android-actions/setup-android`, Java 17, Rust Android targets)
- Removed `gen/android` from `.gitignore` so scaffold is committed
- Pushed tag v1.0.4

## v1.0.3 — Ad code removed
- Deleted `src/components/shared/AdsterraBanner.tsx`
- Deleted `src/components/shared/AdGateway.tsx`
- Deleted `src/components/desktop/dashboard/DesktopAdBanner.tsx`
- Edited `src/App.tsx`: removed AdGateway import/usage, removed ad_gateway_passed check, removed ad_click_thanks toast, removed ad-gateway auth status
- Edited `src/components/desktop/DesktopDashboard.tsx`: removed DesktopAdBanner import/usage
- Edited `src/components/mobile/MobileDashboard.tsx`: removed AdsterraBanner import/usage, removed adVisible var
- Edited `src/components/desktop/dashboard/SettingsModal.tsx`: removed cameronamer.com links
- Edited `src/components/mobile/MobileDashboard.tsx`: removed cameronamer.com links
- Edited `src-tauri/tauri.conf.json`: removed cameronamer.com from CSP frame-src
- Edited `src-tauri/tauri.conf.json`: fixed updater endpoint URL (lowercase ausync)
- Cleaned up unused `toast` import in App.tsx
- Frontend builds clean (`tsc --noEmit` passes, `vite build` succeeds)

## v1.0.2 — Logo finalized
- Generated all app icons from user's actual logo file (`cloud-device-electronic-svgrepo-com.svg`)
- Used cairosvg to render at all required sizes
- Delivered working Windows installer via CI

## v1.0.1 — CI/CD working
- GitHub secrets set up: `TAURI_SIGNING_PRIVATE_KEY`, `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`
- Updated `.github/workflows/release.yml` to build on all platforms
- Tauri updater plugin enabled with proper pubkey

## v1.0.0 — Initial rebrand
- Cloned TG Drive from `caamer20/Telegram-Drive`
- Rebranded all references: "Telegram Drive" → "AuSync", `com.cameronamer` → `com.darkinlife71`
- Created GitHub repo `darkinlife71/ausync`
- Generated Tauri signing key pair
- Pushed initial source
