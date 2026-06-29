import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5200',
      '/auth': 'http://localhost:5200',
      '/logout': 'http://localhost:5200',
    },
  },
  build: {
    outDir: 'dist',
  },
});
