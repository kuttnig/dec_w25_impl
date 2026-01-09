import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In Docker Vite should proxy to Express über via service name
// Lokal (without Docker) we could set VITE_PROXY_TARGET=http://localhost:5172 
const proxyTarget = process.env.VITE_PROXY_TARGET || 'http://express-dev:5172';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      // Everything that goes to /api/* in the frontend is forwarded to Express.
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
      },
    },
  },
});
