import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    vue({ template: { transformAssetUrls } }),
    vuetify({ autoImport: true }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-192.png',
        'icons/icon-maskable-512.png',
        'icons/apple-touch-icon-180.png',
        'icons/icon.svg',
      ],
      manifest: {
        id: '/',
        name: 'Price Estimator',
        short_name: 'Price Estimator',
        description:
          '3D printing model quotes based on the US dollar exchange rate in Cuba',
        theme_color: '#1867c0',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'en',
        dir: 'ltr',
        categories: ['productivity', 'utilities'],
        // Chromium (and therefore Brave) requires raster icons of at least
        // 192x192 and 512x512 to consider the app installable; an SVG-only
        // icon set fails that check. "any" and "maskable" are kept as separate
        // entries because a maskable icon needs safe-zone padding that would
        // make it look shrunken when used as a normal icon.
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
