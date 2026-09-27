/* Man Power — service worker
   - Fixed infinite reload loop
   - Never deletes glsmp-integrity (session integrity token) on activate
   - Precaches all tab partials for offline section viewing
*/
const CACHE = 'metpower-v36';
const KEEP_CACHES = new Set([CACHE, 'glsmp-integrity']);
const PRECACHE = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/firebase-init.js',
  './js/polyfill.js',
  './manifest.json',
  './vkslogo512.png',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './mp-logo-transparent.png',
  './myshift.html',
  './schedule.html',
  './leave.html',
  './reports.html',
  './pending.html',
  './team.html',
  './instructions.html',
  './todo.html',
  './privacy.html'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !KEEP_CACHES.has(k))
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || (event.data && event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Never cache Firebase / Google APIs (live data)
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis') ||
      url.hostname.includes('gstatic') || url.hostname.includes('nager.at')) {
    return;
  }

  // App-shell + partials: cache-first so offline sections still open
  const isAppAsset = url.origin === self.location.origin;
  if (isAppAsset) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // Other same-origin or CDN: network with cache fallback
  event.respondWith(
    fetch(req).then((res) => {
      if (res && res.ok && isAppAsset) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
      }
      return res;
    }).catch(() => caches.match(req))
  );
});
