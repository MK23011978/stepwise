import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// In development the API runs on :3000; the dev server proxies /api so cookies stay same-origin.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: false } } },
  build: { outDir: 'dist', sourcemap: true, chunkSizeWarningLimit: 900 },
  test: { environment: 'jsdom' },
});
