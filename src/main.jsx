import React from 'react';
import ReactDOM from 'react-dom/client';
import { Radio } from 'lucide-react';
import { installStorageGuard } from './utils/safeStorage';
import App from './App.jsx';
import ErrorBoundary from './common/ErrorBoundary.jsx';
import './index.css';

// Provide global Radio icon reference so no legacy or cached module can ever throw "Radio is not defined"
if (typeof window !== 'undefined') {
  window.Radio = Radio;
  globalThis.Radio = Radio;
}

// Must run before any component touches localStorage
installStorageGuard();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Purge stale v5 cache and handle Service Worker registration cleanly
if (typeof window !== 'undefined') {
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== 'fcc-smart-library-v8') {
          caches.delete(key).catch(() => {});
        }
      });
    }).catch(() => {});
  }

  if ('serviceWorker' in navigator) {
    const isDevServer = window.location.port === '5172' || window.location.port === '5173' || import.meta.env?.DEV;
    if (isDevServer) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister().catch(() => {}));
      }).catch(() => {});
    } else {
      window.addEventListener('load', () => {
        const swPath = window.location.pathname.includes('/fcclibrary') ? '/fcclibrary/sw.js' : '/sw.js';
        navigator.serviceWorker.register(swPath).then((reg) => {
          reg.update().catch(() => {});
        }).catch(() => {
          navigator.serviceWorker.register('./sw.js').catch(() => {});
        });
      });
    }
  }
}
