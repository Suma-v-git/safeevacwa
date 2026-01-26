import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5000,
      host: '0.0.0.0',
      allowedHosts: [
        'alfred-unantagonised-roselle.ngrok-free.dev',
        '.ngrok-free.app'
      ],
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 1600,
    },
    plugins: [
      basicSsl(), // Generate self-signed SSL certificate
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['safeevac-192.png', 'safeevac-512.png', 'safeevac-apple.png', 'safeevac-favicon.ico'],
        manifest: {
          name: 'SafeEvac AI Emergency Assistant',
          short_name: 'SafeEvac Mobile',
          description: 'AI-powered Emergency Evacuation Assistant',
          theme_color: '#1d4ed8',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/safeevac-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/safeevac-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          // Precache all app files for offline use
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],

          // Clean up old caches
          cleanupOutdatedCaches: true,

          // Skip waiting to activate new service worker immediately
          skipWaiting: true,
          clientsClaim: true,

          runtimeCaching: [
            // Cache app navigation requests
            {
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: {
                cacheName: 'pages-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 86400 // 24 hours
                },
                networkTimeoutSeconds: 10
              }
            },
            // Cache API calls with network first strategy
            {
              urlPattern: /^https?:\/\/.*\/api\/.*/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 300 // 5 minutes
                },
                networkTimeoutSeconds: 10
              }
            },
            // Cache external APIs (weather, geocoding, etc.)
            {
              urlPattern: /^https:\/\/(api\.|.*\.googleapis\.com|.*\.openstreetmap\.org|.*\.graphhopper\.com|ipapi\.co)/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'external-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 3600 // 1 hour
                },
                networkTimeoutSeconds: 10
              }
            },
            // Cache images with cache first strategy
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 2592000 // 30 days
                }
              }
            },
            // Cache fonts
            {
              urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'fonts-cache',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 31536000 // 1 year
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
