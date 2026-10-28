#!/usr/bin/env node
// Renders public/favicon.svg to every raster icon the project references:
//   public/icons/pwa-192x192.png   PWA manifest (installability requires >=192px)
//   public/icons/pwa-512x512.png   PWA manifest (any + maskable)
//   public/apple-touch-icon.png    iOS "Add to Home Screen" (180x180)
//   electron/resources/icon.png    electron-builder source icon (1024x1024);
//                                  electron-builder derives .ico (Windows) and .icns (macOS)
//   electron/resources/icons/NxN.png
//                                  Linux hicolor icon set (16..1024 px) for AppImage/deb/rpm
// Also writes public/masked-icon.svg (monochrome Safari pinned-tab icon).
//
// Requires Playwright's bundled Chromium:  npx playwright install chromium
// Run:  npm run icons
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// CommonJS require honours NODE_PATH, so a globally installed Playwright also works.
const { chromium } = createRequire(import.meta.url)('playwright');

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(resolve(root, 'public/favicon.svg'), 'utf8');

const targets = [
  { out: 'public/icons/pwa-192x192.png', size: 192 },
  { out: 'public/icons/pwa-512x512.png', size: 512 },
  { out: 'public/apple-touch-icon.png', size: 180 },
  { out: 'electron/resources/icon.png', size: 1024 },
  ...[16, 24, 32, 48, 64, 128, 256, 512, 1024].map(size => ({ out: `electron/resources/icons/${size}x${size}.png`, size })),
];

const browser = await chromium.launch();
try {
  for (const { out, size } of targets) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(
      `<!doctype html><html><body style="margin:0;background:transparent">` +
        svg.replace('<svg ', `<svg width="${size}" height="${size}" `) +
        `</body></html>`,
    );
    const dest = resolve(root, out);
    mkdirSync(dirname(dest), { recursive: true });
    await page.screenshot({ path: dest, omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    await page.close();
    console.log(`wrote ${out} (${size}x${size})`);
  }
} finally {
  await browser.close();
}

// Monochrome pinned-tab icon: same cap silhouette, single colour, no background.
const masked = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <polygon points="24,14 38,21 24,28 10,21" fill="#000"/>
  <polygon points="24,22 34,18 34,29 24,33 14,29 14,18" fill="#000"/>
  <rect x="35" y="21" width="2" height="10" rx="1" fill="#000"/>
  <circle cx="36" cy="32" r="2" fill="#000"/>
</svg>
`;
writeFileSync(resolve(root, 'public/masked-icon.svg'), masked);
console.log('wrote public/masked-icon.svg');
