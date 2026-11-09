import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'path';
import { spawn } from 'child_process';
import net from 'net';

const ensureMultiPhpBackend = () => {
  const sock = new net.Socket();
  sock.setTimeout(350);
  sock.once('connect', () => {
    sock.destroy();
  });
  sock.once('error', () => {
    sock.destroy();
    try {
      const child = spawn(process.execPath, [resolve(__dirname, 'scripts/multi-php-server.cjs')], {
        cwd: __dirname,
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
    } catch (e) {}
  });
  sock.once('timeout', () => {
    sock.destroy();
  });
  sock.connect(8010, '127.0.0.1');
};

ensureMultiPhpBackend();

const qrApproveFallbackPlugin = () => ({
  name: 'qr-approve-fallback',
  configureServer(server) {
    ensureMultiPhpBackend();
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
        target: 'http://127.0.0.1:8010',
        changeOrigin: true,
        secure: false
      },
      '/storage': {
        target: 'http://127.0.0.1:8010',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
