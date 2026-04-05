const CACHE_NAME = 'picclock-v1';
const ASSETS = [
  '/picclock/',
  '/picclock/index.html',
  '/picclock/manifest.json',
  '/picclock/icon-192.png',
  '/picclock/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
