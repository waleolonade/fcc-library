// FCC Smart Library Service Worker - PWA Offline Shell & Fast Asset Caching
const CACHE_NAME = 'fcc-mobile-pass-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/fcc-logo.png',
  '/fcc-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('PWA SW pre-cache fallback:', err);
      });
    })
  );
  self.skipWaiting();
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
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Let API and backend communication pass directly
  if (url.pathname.startsWith('/api') || url.pathname.includes('/api/')) {
    return;
  }

  // Network-first with cache fallback for HTML navigation
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
          }
          return res;
        })
        .catch(() => caches.match('/index.html') || caches.match('/'))
    );
    return;
  }

  // Cache-first for images, fonts, styles, and scripts
  event.respondWith(
    caches.match(req).then((cachedRes) => {
      if (cachedRes) {
        // Background refresh
        fetch(req)
          .then((networkRes) => {
            if (networkRes && networkRes.status === 200 && req.method === 'GET') {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, networkRes.clone())).catch(() => {});
            }
          })
          .catch(() => {});
        return cachedRes;
      }
      return fetch(req).then((res) => {
        if (res && res.status === 200 && req.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        }
        return res;
      });
    })
  );
});
