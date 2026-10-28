# Schola – Cross-Platform Build Guide

Schola is built with **React + Vite** for the core UI, **Capacitor** for Android/iOS, and **Electron** for desktop (Windows, macOS, Linux).

---

## Prerequisites

| Tool | Version | Required for |
|------|---------|-------------|
| Node.js | ≥ 22 | All platforms |
| npm | ≥ 10 | All platforms |
| Android Studio + SDK | Latest | Android |
| Xcode | ≥ 15 | iOS / macOS |
| CocoaPods | Latest | iOS |
| Java JDK | 17 | Android |

Install Node dependencies first:

```bash
npm install
```

---

## Web (PWA)

```bash
# Development server
npm run dev

# Production build → dist/
npm run build:web
```

The `dist/` folder can be deployed to any static host (Netlify, Vercel, GitHub Pages, AWS S3, etc.),
at the domain root or under any sub-path (asset URLs are relative and routing is hash-based).
The app includes a full **PWA manifest** and **service worker** for offline use.
Users can install it from the browser ("Add to Home Screen" / "Install app").

**GitHub Pages** is deployed by `.github/workflows/pages.yml` on every push to `main`
and after every release:

| URL | Content |
|-----|---------|
| `https://socrtwo.github.io/Schola/` | newest release build (falls back to `main`) |
| `.../Schola/main/` | current `main` branch build |
| `.../Schola/vX.Y.Z/` | the `schola-web.zip` attached to that release |
| `.../Schola/about/` | README landing page |
| `.../Schola/versions.html` | index of all of the above |

### Icons

All raster icons (PWA 192/512 px, `apple-touch-icon.png`, and the 1024 px
`electron/resources/icon.png` that electron-builder turns into `.ico` / `.icns`,
plus the Linux hicolor set in `electron/resources/icons/`) are generated from `public/favicon.svg`. They are committed, so you only need to
regenerate after changing the SVG:

```bash
npx playwright install chromium   # once
npm run icons
```

---

## Android

Requirements: Android Studio + SDK, Java 17, ANDROID_HOME set.

```bash
# First time – add the platform
npm run cap:add:android

# Every subsequent build
npm run build:android
# → opens Android Studio; press ▶ to run or build APK

# Or build APK directly:
cd android
./gradlew assembleDebug             # debug APK
./gradlew assembleRelease           # signed release APK (needs keystore)
```

**Signed release build** – create `android/schola.keystore` and add to `capacitor.config.ts` / `android/app/build.gradle`.

Output: `android/app/build/outputs/apk/`

---

## iOS

Requirements: macOS, Xcode ≥ 15, CocoaPods.

```bash
# First time – add the platform
npm run cap:add:ios

# Every subsequent build
npm run build:ios
# → opens Xcode; select target device / simulator and press ▶

# Install pods (required after adding platform or updating deps)
cd ios/App && pod install
```

**App Store distribution** requires an Apple Developer account (paid), provisioning profiles, and code-signing in Xcode.

---

## macOS (Electron)

```bash
npm run electron:build:mac
```

Produces:
- `release/Schola-x.y.z-universal.dmg` – drag-and-drop installer
- `release/Schola-x.y.z-universal-mac.zip` – zip archive

**Notarization** (for Gatekeeper): set `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`, and `CSC_LINK` env vars / GitHub secrets before building.

---

## Windows (Electron)

```bash
npm run electron:build:win
```

Produces:
- `release/Schola Setup x.y.z.exe` – NSIS installer
- `release/Schola x.y.z.exe` – portable executable

(GitHub replaces the spaces with dots in release asset names: `Schola.Setup.x.y.z.exe`.)

Cross-compiling from macOS/Linux requires `wine` or use the Windows GitHub Actions runner.

---

## Linux (Electron)

```bash
npm run electron:build:linux
```

Produces:
- `release/Schola-x.y.z.AppImage` – portable, runs on any distro
- `release/schola_x.y.z_amd64.deb` – Debian / Ubuntu
- `release/schola-x.y.z.x86_64.rpm` – Fedora / RHEL

---

## Automated CI/CD (GitHub Actions)

The workflow in `.github/workflows/build.yml` automatically:

| Trigger | Builds |
|---------|--------|
| Push to `main` or `claude/**`, pull request to `main` | All platforms (Web, Windows, macOS, Linux, Android, iOS) as workflow artifacts |
| Tag `v*.*.*`, or *Run workflow* with a `version` input | All platforms + creates the GitHub Release with the installers attached, then redeploys GitHub Pages |

Release assets:

| Asset | Platform |
|-------|----------|
| `Schola.Setup.x.y.z.exe`, `Schola.x.y.z.exe` | Windows installer / portable (signed when the Azure variables are set, see `SIGNING.md`) |
| `Schola-x.y.z-universal.dmg`, `Schola-x.y.z-universal-mac.zip` | macOS |
| `Schola-x.y.z.AppImage`, `schola_x.y.z_amd64.deb`, `schola-x.y.z.x86_64.rpm` | Linux |
| `Schola-x.y.z-android-debug.apk` | Android (debug-signed, sideload) |
| `Schola-x.y.z-ios-simulator.zip` | iOS simulator `.app` (unsigned; device builds need Xcode + an Apple Developer account) |
| `schola-web.zip`, `schola-chromeos.zip`, `schola-ios-pwa.zip` | Static web build + PWA install notes |

The version in `package.json` is stamped from the tag at build time, so installer
file names and the app's *About* version always match the release tag.

### Creating a release

```bash
git tag v1.3.5
git push origin v1.3.5
```

or open *Actions → Build Schola – All Platforms → Run workflow* and enter the
version (e.g. `v1.3.5`); the tag is then created server-side.

---

## Project Structure

```
Schola/
├── src/                        # React source
│   ├── components/             # UI components
│   │   ├── Dashboard.tsx
│   │   ├── StudentDirectory.tsx
│   │   ├── CourseSchedule.tsx
│   │   ├── ClassRosters.tsx
│   │   ├── Transactions.tsx
│   │   └── Navigation.tsx
│   ├── data/
│   │   └── sampleData.ts       # App data (from repo CSV/xlsx)
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── electron/
│   ├── main.cjs                # Electron main process
│   ├── preload.cjs             # Context bridge
│   └── resources/icon.png      # App icon source (→ .ico/.icns by electron-builder)
├── public/
│   ├── favicon.svg             # Master icon (SVG)
│   ├── icons/                  # PWA icons generated from favicon.svg
│   ├── apple-touch-icon.png
│   └── masked-icon.svg
├── scripts/
│   ├── generate-icons.mjs      # npm run icons
│   └── setup-azure-signing.sh  # One-time Windows code-signing setup
├── web/index.html              # README-driven landing page (Pages /about/)
├── android/                    # Generated by: npx cap add android
├── ios/                        # Generated by: npx cap add ios
├── dist/                       # Generated by: npm run build
├── release/                    # Generated by: electron-builder
├── .github/workflows/build.yml # CI/CD for all platforms + releases
├── .github/workflows/pages.yml # Versioned GitHub Pages deployment
├── capacitor.config.ts         # Capacitor (Android + iOS)
├── vite.config.ts              # Vite + PWA plugin (manifest lives here)
├── tailwind.config.js          # Tailwind CSS
├── package.json                # Dependencies + build scripts
└── tsconfig.json               # TypeScript config
```
