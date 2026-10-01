import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['localhost', '127.0.0.1', 'cake-even-ambush.ngrok-free.dev'],
    proxy: { '/api': 'http://localhost:4000' }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/analytics', 'firebase/auth', 'firebase/firestore']
        }
      }
    }
  }
});
