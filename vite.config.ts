import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    watch: {
      ignored: ['**/.bot-source-*/**']
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'assets/brand/app-icon-64.png',
        'assets/brand/app-icon-192.png',
        'assets/brand/app-icon-512.png'
      ],
      manifest: {
        name: 'МотоХаб',
        short_name: 'МотоХаб',
        description: 'Локальный помощник мотоциклиста в Смоленске и области.',
        theme_color: '#071012',
        background_color: '#071012',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/assets/brand/app-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/assets/brand/app-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
});
