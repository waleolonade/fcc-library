import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'path';

const qrApproveFallbackPlugin = () => ({
  name: 'qr-approve-fallback',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = req.url || '';
      if (url.startsWith('/qr-approve') || url.startsWith('/mobile-pass')) {
        res.writeHead(302, { Location: '/#' + url });
        res.end();
        return;
      }
      next();
    });
  }
});

export default defineConfig({
  base: './',
  plugins: [
    react(),
    basicSsl(),
    qrApproveFallbackPlugin()
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        student: resolve(__dirname, 'student.html'),
      },
    },
  },
  server: {
    port: 5172,
    host: true,
    https: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
