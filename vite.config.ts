import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/rapidapi': {
        target: 'https://world-cup-2026-live-api.p.rapidapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rapidapi/, ''),
        headers: {
          'x-rapidapi-host': 'world-cup-2026-live-api.p.rapidapi.com',
          'x-rapidapi-key': '8cd55db2efmshe705a46fa2732b5p1b82c1jsnb07db50bc007',
          'Content-Type': 'application/json',
        },
      },
    },
  },
});
