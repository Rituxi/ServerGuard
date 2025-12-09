import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'app.html' // Explicitly point to the renamed entry file
    }
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
      '/cover-card.png': 'http://localhost:3000',
      '/donate-qrcode1.png': 'http://localhost:3000'
    }
  }
});