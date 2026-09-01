const CACHE_NAME = 'wl-western-legends-companion-v156';
const APP_SHELL = [
  './',
  './index.html',
  './version.json',
  './manifest.webmanifest',
  './css/styles.css?v=156',
  './css/home-frontier.css?v=137',
  './js/localized-data.js',
  './js/character-picker-core.js?v=137',
  './js/contextual-music-core.js?v=137',
  './js/update-core.js?v=139',
  './js/trigger-refresh-core.js?v=149',
  './js/game-mode-core.js?v=156',
  './js/app.js?v=156',
  './js/home-frontier.js?v=137',
  './assets/icons/icon.svg',
  './assets/icons/icon-cabin.png',
  './assets/icons/icon-hat.png',
  './assets/icons/icon-book.png',
  './assets/icons/icon-lantern.png',
  './assets/icons/icon-gazette.png',
  './assets/icons/icon-fight.png',
  './assets/images/tab.png',
  './assets/images/moods/mood-law.png',
  './assets/images/moods/mood-outlaw.png',
  './assets/images/moods/mood-standoff.png',
  './assets/images/moods/mood-poker.png',
  './assets/images/moods/mood-revelry.png',
  './assets/images/moods/mood-range.png',
  './assets/images/moods/mood-prospect.png',
  './assets/images/moods/mood-trade.png',
  './assets/images/moods/mood-railroad.png',
  './assets/images/moods/mood-explore.png',
  './assets/images/moods/mood-posse.png',
  './assets/images/moods/mood-intrigue.png',
  './assets/images/moods/mood-legendary.png',
  './assets/images/moods/mood-quiet.png',
  './assets/images/moods/mood-frontier.png',
  './assets/images/triggers/bandit.svg',
  './assets/images/triggers/prospect.svg',
  './assets/images/triggers/item.svg',
  './assets/images/triggers/move.svg',
  './assets/images/triggers/poker.svg',
  './assets/images/triggers/ranch.svg',
  './assets/images/triggers/generic.svg',
  './assets/images/newspaper/frontier-gazette-masthead.png',
  './assets/images/newspaper/paper-texture-tile.png',
  './assets/images/newspaper/paper-imperfections-tile.png',
  './assets/images/newspaper/paper-edge-frame.png',
  './data/settings.json?v=136',
  './data/ui.json',
  './data/characters.json',
  './data/boards.json',
  './data/triggers.json',
  './data/one-off-events.json',
  './data/character-arcs.json',
  './data/major-storylines.json',
  './data/world-events.json',
  './data/locations.json',
  './data/newspaper-generator.json',
  './data/game-modes.json',
  './data/poker-cards.json',
  './data/setup-assist.json',
  './data/setup-visual.json',
  './data/items.json',
  './data/final-scoring.json',
  './js/setup-plan-core.js?v=156',
  './js/visual-setup-core.js?v=156',
  './js/visual-setup.js?v=156',
  './assets/images/boards/main-board.png',
  './assets/images/boards/full.png',
  './assets/images/boards/story.png',
  './assets/images/boards/general-store-stand.png',
  './assets/images/boards/player-mat-front.png',
  './assets/images/cards/story-back.png',
  './assets/images/cards/money-10.png',
  './assets/images/cards/money-20.png',
  './assets/images/cards/poker-back.png',
  './assets/images/cards/fight-back.png',
  './assets/images/cards/events-back.png',
  './assets/images/cards/train-back.png',
  './assets/images/cards/injury-back.png',
  './assets/images/cards/travelingtrader-back.png',
  './assets/images/cards/treasurehunting-back.png',
  './assets/images/cards/hunting-back.png',
  './assets/images/cards/fishing-back.png',
  './assets/images/cards/foraging-back.png',
  './assets/images/cards/mib.png',
  './assets/images/tokens/ranch-blue.png',
  './assets/images/tokens/ranch-green.png',
  './assets/images/tokens/ranch-orange.png',
  './assets/images/tokens/longhorn.png',
  './assets/images/tokens/outlaw.png',
  './assets/images/tokens/highroller.png',
  './assets/images/tokens/gold.png',
  './assets/images/tokens/legend.png',
  './assets/images/tokens/deed.png',
  './assets/images/tokens/watch.png',
  './assets/images/tokens/event-token.png',
  './assets/images/tokens/action-frontier.png',
  './assets/images/tokens/trader.png',
  './assets/images/boards/ante-up-frontier.png',
  './assets/images/boards/ante-up-gambler.png',
  './assets/images/cards/item-back.png',
  './assets/images/tokens/firstplayer.png',
  './assets/images/tokens/gold-nugget.png',
  './assets/images/tokens/legendary.png',
  './assets/images/tokens/action-sheriff.png',
  './assets/images/tokens/action-bandit.png',
  './assets/images/tokens/action-train.png',
  './assets/images/tokens/action-store.png',
  './assets/images/cards/item-bedroll.png',
  './assets/images/cards/item-bootknife.png',
  './assets/images/cards/item-bullwhip.png',
  './assets/images/cards/item-burro.png',
  './assets/images/cards/item-carbine.png',
  './assets/images/cards/item-derringer.png',
  './assets/images/cards/item-gazette.png',
  './assets/images/cards/item-holster.png',
  './assets/images/cards/item-medicinepouch.png',
  './assets/images/cards/item-minersmap.png',
  './assets/images/cards/item-mule.png',
  './assets/images/cards/item-mustang.png',
  './assets/images/cards/item-peacekeeper.png',
  './assets/images/cards/item-pocketwatch.png',
  './assets/images/cards/item-provisions.png',
  './assets/images/cards/item-quarterhorse.png',
  './assets/images/cards/item-repeatingshotgun.png',
  './assets/images/cards/item-revolver.png',
  './assets/images/cards/item-rifle.png',
  './assets/images/cards/item-saddlebags.png',
  './assets/images/cards/item-shotgun.png',
  './assets/images/cards/item-snakeoil.png',
  './assets/images/cards/item-tengallon.png',
  './assets/images/cards/item-whiskey.png',
  './assets/images/cards/item-workhorse.png'
];

self.addEventListener('install', event => {
  // Do not skip waiting automatically. The UI can now tell the user that a
  // published version is available and activate it only when they choose it.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function refreshAppCache() {
  // This is the content-update fallback that makes version.json authoritative:
  // even when sw.js itself did not change, Update Now can refresh the cached
  // shell from the network and reload into the newly published files.
  await caches.delete(CACHE_NAME);
  const cache = await caches.open(CACHE_NAME);
  const results = await Promise.allSettled(APP_SHELL.map(async url => {
    const response = await fetch(new Request(url, { cache: 'reload' }));
    if (response.status === 200) await cache.put(url, response.clone());
  }));
  // index.html must be available before we tell the page to reload.
  const indexResult = results[APP_SHELL.indexOf('./index.html')];
  if (indexResult?.status === 'rejected') throw indexResult.reason;
}

self.addEventListener('message', event => {
  const data = event.data;
  if (data === 'skipWaiting' || data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (data && data.type === 'REFRESH_APP_CACHE') {
    event.waitUntil(refreshAppCache().then(() => {
      event.source?.postMessage({ type: 'APP_CACHE_REFRESHED', requestId: data.requestId || '' });
    }).catch(error => {
      event.source?.postMessage({ type: 'APP_CACHE_REFRESH_FAILED', requestId: data.requestId || '', message: String(error?.message || error) });
    }));
  }
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  // Update checks must always reach the network. The regular version.json URL
  // remains cached so it represents the version of the code currently running.
  if (url.pathname.endsWith('/version.json') && url.searchParams.has('updateCheck')) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
    return;
  }

  // Audio/video commonly use HTTP Range requests, which return 206 Partial
  // Content. The Cache API rejects cache.put() for 206 responses, so let
  // those requests go directly to the network instead of trying to cache them.
  if (event.request.headers.has('range')) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(async response => {
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
