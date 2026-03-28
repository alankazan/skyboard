const CACHE_NAME = 'skyboard-v2';
const ASSETS = [
  '/',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/quotes.js',
  'manifest.json',
  'icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
