import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Em dev, /api vai para a API (mesma origem para o navegador: cookies sem CORS)
const apiTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:3333';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.PORT) || 5173,
    strictPort: true,
    proxy: { '/api': { target: apiTarget } },
  },
  preview: {
    proxy: { '/api': { target: apiTarget } },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
