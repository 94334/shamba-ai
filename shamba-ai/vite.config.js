import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon.svg'],
      devOptions: {
        enabled: true, // lets you test the PWA in dev mode
      },
      manifest: {
        name: 'Shamba AI — Kirinyaga Farm Advisor',
        short_name: 'Shamba AI',
        description:
          'AI-powered farm advisor for Kirinyaga County. Crop advice, disease diagnosis from photos, live weather, and market prices — in English and Swahili.',
        theme_color: '#3B6D11',
        background_color: '#EAF3DE',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        lang: 'en',
        categories: ['agriculture', 'productivity', 'utilities'],
        icons: [
          { src: 'icons/icon-72.png',  sizes: '72x72',   type: 'image/png' },
          { src: 'icons/icon-96.png',  sizes: '96x96',   type: 'image/png' },
          { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Diagnose my crop',
            short_name: 'Diagnose',
            description: 'Upload a photo for instant crop disease diagnosis',
            url: '/?action=diagnose',
            icons: [{ src: 'icons/icon-96.png', sizes: '96x96' }],
          },
          {
            name: 'Check Kerugoya weather',
            short_name: 'Weather',
            description: 'See todays weather and farming tips',
            url: '/?action=weather',
            icons: [{ src: 'icons/icon-96.png', sizes: '96x96' }],
          },
          {
            name: 'Market prices',
            short_name: 'Prices',
            description: 'Ask about current crop prices in Kirinyaga',
            url: '/?action=prices',
            icons: [{ src: 'icons/icon-96.png', sizes: '96x96' }],
          },
        ],
      },
      workbox: {
        // Pre-cache all built assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Cache Open-Meteo weather for 1 hour (NetworkFirst = try fresh, fallback to cache)
            urlPattern: /^https:\/\/api\.open-meteo\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'weather-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
            },
          },
          {
            // Never cache Anthropic AI responses — always fresh
            urlPattern: /^https:\/\/api\.anthropic\.com\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
