// FCC Smart Library Service Worker - PWA Offline Shell & Network-First Code Delivery
const CACHE_NAME = 'fcc-smart-library-v8';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/assets/fcc-logo.png',
  '/fcc-logo.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 1. Never intercept API calls, Vite HMR, source modules, or dev server dependencies
  if (
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/api/') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/@') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.endsWith('.jsx') ||
    url.search.includes('t=') ||
    url.port === '5172' ||
    url.port === '5173'
  ) {
    return;
  }

  // 2. Network-first for HTML navigation and JS/CSS bundles
  if (
    req.mode === 'navigate' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.mjs') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.html')
  ) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match(req) || caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // 3. Cache-first only for static images/fonts/icons
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes && cachedRes.status === 200) {
        return cachedRes;
      }
      return fetch(req).then((res) => {
        if (res && res.status === 200) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        }
        return res;
      });
    })
  );
});
