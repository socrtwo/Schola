# Schola — Android TWA (Trusted Web Activity)

This directory contains the configuration for building an Android APK that
wraps the Schola PWA using a Trusted Web Activity.

## How it works

A TWA is a lightweight Android app that opens your deployed Schola web app
in a full-screen Chrome Custom Tab — no browser UI, looks like a native app.

## Prerequisites

1. **A deployed Schola instance** with HTTPS (e.g., `https://schola.example.com`)
2. **Android SDK** (or use the GitHub Actions workflow which sets this up)
3. **Node.js 18+** for Bubblewrap CLI

## Configuration

Edit `twa-manifest.json` and set:

- `host`: Your deployed Schola domain (e.g., `schola.example.com`)
- `startUrl`: Usually `/`
- `packageId`: Your Android package ID (e.g., `com.yourorg.schola`)

## Build locally

```bash
npm install -g @bubblewrap/cli

# Initialize the TWA project (first time only)
cd android-twa
bubblewrap init --manifest=twa-manifest.json --directory=build

# Build the APK
cd build
bubblewrap build --skipPwaValidation
```

The APK will be at `build/app-release-unsigned.apk`.

## Signing for Google Play

To publish on Google Play, you need to sign the APK:

```bash
# Generate a signing key (one time)
keytool -genkey -v -keystore android.keystore -alias schola \
  -keyalg RSA -keysize 2048 -validity 10000

# Sign the APK
apksigner sign --ks android.keystore --ks-key-alias schola \
  app-release-unsigned.apk
```

## Digital Asset Links

For the TWA to work properly (full-screen, no browser bar), you must add a
Digital Asset Links file to your Schola server at:

```
https://yourdomain.com/.well-known/assetlinks.json
```

See: https://developer.android.com/training/app-links/verify-android-applinks

## Note on iOS

iOS does not support TWAs. For iOS, users install the PWA directly:
1. Open your Schola URL in Safari
2. Tap Share > "Add to Home Screen"
3. The app appears on the home screen with the Schola icon

This provides a native-app-like experience with offline support via the
service worker.
