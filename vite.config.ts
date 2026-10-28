import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        id: './',
        name: 'Schola – Continuing Education',
        short_name: 'Schola',
        description: 'Administration system for continuing education programs',
        theme_color: '#1e3a5f',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        categories: ['education', 'productivity'],
        lang: 'en-US',
        shortcuts: [
          { name: 'Dashboard', url: './#/dashboard', description: 'Overview and statistics' },
          { name: 'Students', url: './#/students', description: 'View student directory' },
          { name: 'Schedule', url: './#/schedule', description: 'View course schedule' },
        ],
        icons: [
          {
            src: 'icons/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Routing is hash-based, so no SPA navigation fallback is needed. Leaving
        // the default ('index.html') on would make the service worker at the
        // Pages site root hijack navigations to sibling deployments such as
        // /Schola/main/ and /Schola/v1.3.4/ and serve the root build instead.
        navigateFallback: null,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
