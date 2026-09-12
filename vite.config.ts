import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => ({
  base: mode === 'production' && process.env.GITHUB_ACTIONS === 'true' ? '/simple-game-shooter/' : '/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/app-icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'],
      manifest: {
        id: './',
        name: 'Untitled project',
        short_name: 'Project',
        description: 'An installable web application.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#171717',
        theme_color: '#171717',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
      },
    }),
  ],
}));
