// FCC Smart Library Service Worker - PWA Offline Shell & Fast Asset Caching
const CACHE_NAME = 'fcc-library-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/fcc-logo.png',
  './fcc-logo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
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
  // Let API requests pass directly to backend
  if (req.url.includes('/api/')) {
    return;
  }

  // Network-first with cache fallback
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && req.method === 'GET') {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, resClone).catch(() => {});
          });
        }
        return res;
      })
      .catch(() => caches.match(req))
  );
});
