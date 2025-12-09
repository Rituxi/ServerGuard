import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Express server expects static files here
  },
  server: {
    proxy: {
      // Proxy API requests to backend during local development
      '/api': 'http://localhost:3000',
      '/cover-card.png': 'http://localhost:3000',
      '/donate-qrcode1.png': 'http://localhost:3000'
    }
  }
});