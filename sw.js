const CACHE_NAME = 'wl-western-legends-companion-v104';
const APP_SHELL = [
  './', './index.html', './manifest.webmanifest', './css/styles.css', './js/localized-data.js', './js/character-picker-core.js', './js/app.js', './assets/icons/icon.svg',
  './assets/images/triggers/bandit.svg', './assets/images/triggers/prospect.svg', './assets/images/triggers/item.svg',
  './assets/images/triggers/move.svg', './assets/images/triggers/poker.svg', './assets/images/triggers/ranch.svg', './assets/images/triggers/generic.svg', './assets/images/newspaper/frontier-gazette-masthead.png', './assets/images/newspaper/paper-texture-tile.png', './assets/images/newspaper/paper-imperfections-tile.png', './assets/images/newspaper/paper-edge-frame.png',
  './data/settings.json', './data/ui.json', './data/characters.json', './data/triggers.json', './data/one-off-events.json', './data/character-arcs.json',
  './data/major-storylines.json', './data/world-events.json', './data/locations.json', './data/newspaper-generator.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Audio/video commonly use HTTP Range requests, which return 206 Partial
  // Content. The Cache API rejects cache.put() for 206 responses, so let
  // those requests go directly to the network instead of trying to cache them.
  if (event.request.headers.has('range')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(async response => {
      // Cache only complete successful same-origin responses. Never attempt to
      // cache 206 Partial Content (or other non-200 responses).
      if (response.status === 200 && response.type === 'basic') {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, response.clone());
        } catch (err) {
          console.warn('[Service Worker] Cache write skipped:', err);
        }
      }
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
