// Caches the app shell (screens/code) so the app opens instantly and
// works offline. Actual data comes from your Google Sheet via the
// Apps Script backend — this never caches or intercepts calls to
// script.google.com, so your data is always live when you have signal.
const CACHE_NAME = 'pantry-diary-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './api.js',
  './queue.js',
  './config.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never intercept calls to your Apps Script backend or Google —
  // those must always hit the real network.
  if (url.hostname.includes('google') || url.hostname.includes('script.google.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return resp;
      }).catch(() => cached);
    })
  );
});
