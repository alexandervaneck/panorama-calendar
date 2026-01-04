import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';


export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/google-calendar': {
        target: 'https://calendar.google.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/google-calendar/, ''),
      },
      '/proxy-all': {
        target: 'https://corsproxy.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/proxy-all\?url=/, '?url='),
        // Note: Generic proxying is harder with simple vite proxy if target varies.
        // But for Google Calendar specific, the above /google-calendar works great.
      }
    },
  },
});

