// Service worker: lets the app open without connection and be installable.
// Only the app shell is cached; maps, geocoding and routing always go to the network.
const CACHE = 'reparto-v1';
const SHELL = [
  './', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const u = new URL(e.request.url);
  if (u.origin === location.origin) {
    // network first so new versions arrive as soon as there is connection; cache when offline
    e.respondWith(
      fetch(e.request).then(r => {
        if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
        return r;
      }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./')))
    );
  } else if (u.host === 'unpkg.com') {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
