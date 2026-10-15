import React from 'react';
import ReactDOM from 'react-dom/client';
import { installStorageGuard } from './utils/safeStorage';
import App from './App.jsx';
import ErrorBoundary from './common/ErrorBoundary.jsx';
import './index.css';

// Must run before any component touches localStorage
installStorageGuard();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register PWA Service Worker for OS-wide installability (Android, iOS, Windows, macOS, Linux)
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = window.location.pathname.includes('/fcclibrary') ? '/fcclibrary/sw.js' : '/sw.js';
    navigator.serviceWorker.register(swPath).catch(() => {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    });
  });
}
