import { fileURLToPath, URL } from 'node:url';
import { existsSync } from 'node:fs';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import { VitePWA } from 'vite-plugin-pwa';

type ApiHandler = (request: Request) => Promise<Response> | Response;

/**
 * Runs the Vercel functions in `api/` inside the Vite dev server.
 *
 * Plain `vite` has no serverless runtime: without this, a request to
 * `/api/eltoque-rate` resolves to `api/eltoque-rate.ts` and Vite serves the
 * transpiled source code instead of executing it. Production is unaffected;
 * there Vercel runs the functions itself.
 */
function devApiFunctions(): Plugin {
  return {
    name: 'dev-api-functions',
    apply: 'serve',
    configureServer(server) {
      // Expose server-only variables (e.g. ELTOQUE_TOKEN) to the handlers,
      // mirroring Vercel's environment. The empty prefix loads unprefixed keys.
      const env = loadEnv(server.config.mode, server.config.envDir || process.cwd(), '');
      for (const [key, value] of Object.entries(env)) {
        process.env[key] ??= value;
      }

      server.middlewares.use('/api', async (req, res, next) => {
        const url = new URL(req.url ?? '/', 'http://localhost');
        const name = url.pathname.replace(/^\/+|\/+$/g, '');
        const file = fileURLToPath(new URL(`./api/${name}.ts`, import.meta.url));

        if (!/^[\w-]+$/.test(name) || !existsSync(file)) {
          next();
          return;
        }

        try {
          const mod = await server.ssrLoadModule(file);
          const method = req.method ?? 'GET';
          const handler = mod[method] as ApiHandler | undefined;

          if (typeof handler !== 'function') {
            res.statusCode = 405;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (typeof value === 'string') headers.set(key, value);
            else if (Array.isArray(value)) headers.set(key, value.join(', '));
          }

          const response = await handler(
            new Request(`http://${req.headers.host ?? 'localhost'}${req.originalUrl ?? req.url}`, {
              method,
              headers,
            }),
          );

          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          server.ssrFixStacktrace(error as Error);
          next(error);
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [
    devApiFunctions(),
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
        'icons/favicon-32.png',
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
