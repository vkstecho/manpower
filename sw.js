/* Man Power — Service Worker v2.5.17
   Strategies:
   - Precache app shell + JS/CSS/icons/partials on install
   - HTML / navigation: network-first → cache fallback (fresh when online)
   - Static assets (js/css/img/fonts/manifest): stale-while-revalidate
   - Firebase / Google / external APIs: never intercept (live data)
   - Keeps mp-integrity cache (session token) across version bumps
*/
const SW_VERSION = '2.5.17';
const CACHE = 'manpower-v' + SW_VERSION.replace(/\./g, '');
const KEEP_CACHES = new Set([CACHE, 'mp-integrity']);

const PRECACHE = [
  './',
  './index.html',
  './css/app.css',
  './js/train-data.js',
  './js/app.js',
  './js/app-core.js',
  './js/app-login.js',
  './js/app-login-device.js',
  './js/app-login-session.js',
  './js/app-schedule.js',
  './js/app-team.js',
  './js/app-team-import.js',
  './js/app-team-print-learn.js',
  './js/firebase-init.js',
  './js/polyfill.js',
  './js/config.js',
  './js/utils.js',
  './js/a11y.js',
  './js/sched-clipboard.js',
  './js/sched-cell-keys.js',
  './js/i18n_locale.js',
  './js/i18n_ml.js',
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

function isBypassHost(hostname) {
  return (
    hostname.includes('firebase') ||
    hostname.includes('googleapis') ||
    hostname.includes('gstatic') ||
    hostname.includes('google.com') ||
    hostname.includes('nager.at') ||
    hostname.includes('cloudfunctions') ||
    hostname.includes('firebasestorage')
  );
}

function isNavigationRequest(req) {
  return (
    req.mode === 'navigate' ||
    (req.method === 'GET' &&
      req.headers.get('accept') &&
      req.headers.get('accept').includes('text/html'))
  );
}

function isStaticAsset(url) {
  const p = url.pathname;
  return (
    p.endsWith('.js') ||
    p.endsWith('.css') ||
    p.endsWith('.png') ||
    p.endsWith('.jpg') ||
    p.endsWith('.jpeg') ||
    p.endsWith('.webp') ||
    p.endsWith('.svg') ||
    p.endsWith('.ico') ||
    p.endsWith('.woff') ||
    p.endsWith('.woff2') ||
    p.endsWith('.ttf') ||
    p.endsWith('.json') ||
    p.endsWith('.map')
  );
}

function isHtmlPath(url) {
  const p = url.pathname;
  return (
    p === '/' ||
    p.endsWith('.html') ||
    p.endsWith('/') ||
    (!p.includes('.') && url.origin === self.location.origin)
  );
}

/** Cache a successful response (clone once). */
function putInCache(request, response) {
  if (!response || !response.ok) return;
  // Only cache basic/cors same-origin style responses
  if (response.type === 'opaque') return;
  const copy = response.clone();
  caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
}

/** Precache list — tolerate individual failures so one missing file doesn't kill install. */
async function precacheAll() {
  const cache = await caches.open(CACHE);
  await Promise.all(
    PRECACHE.map(async (url) => {
      try {
        const res = await fetch(url, { cache: 'reload' });
        if (res && res.ok) await cache.put(url, res);
      } catch (e) {
        // ignore missing asset during install
      }
    })
  );
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAll().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !KEEP_CACHES.has(k))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (data === 'SKIP_WAITING' || (data && data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
  }
  if (data && data.type === 'GET_VERSION') {
    event.ports &&
      event.ports[0] &&
      event.ports[0].postMessage({ version: SW_VERSION, cache: CACHE });
  }
  if (data && data.type === 'CLEAR_RUNTIME_CACHE') {
    event.waitUntil(
      caches.open(CACHE).then(async (c) => {
        const keys = await c.keys();
        await Promise.all(keys.map((k) => c.delete(k)));
        await precacheAll();
      })
    );
  }
});

/**
 * Network-first for HTML/navigation — prefer fresh shell when online,
 * fall back to cache (and finally index.html) when offline.
 */
async function networkFirstHtml(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok) putInCache(request, res);
    return res;
  } catch (e) {
    const cached =
      (await caches.match(request)) ||
      (await caches.match('./index.html')) ||
      (await caches.match('/index.html')) ||
      (await caches.match('./'));
    if (cached) return cached;
    return new Response(
      '<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0a0f1a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="text-align:center"><h1>Offline</h1><p>Man Power — reconnect to load the app.</p></div></body></html>',
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
}

/**
 * Stale-while-revalidate for static assets — instant from cache,
 * update in background for next visit.
 */
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then((res) => {
      if (res && res.ok) putInCache(request, res);
      return res;
    })
    .catch(() => null);

  if (cached) {
    // Kick off background refresh; return cache immediately
    networkPromise.catch(() => {});
    return cached;
  }

  const networkRes = await networkPromise;
  if (networkRes) return networkRes;

  // Last resort: nothing
  return new Response('', { status: 504, statusText: 'Offline' });
}

/**
 * Cache-first for already-precached shell assets when offline is critical.
 * Falls through to SWR behavior when not in cache.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    // Background refresh
    fetch(request)
      .then((res) => {
        if (res && res.ok) putInCache(request, res);
      })
      .catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res && res.ok) putInCache(request, res);
    return res;
  } catch (e) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch (e) {
    return;
  }

  // Never touch Firebase / Google / external APIs
  if (isBypassHost(url.hostname)) return;

  // Only handle same-origin app traffic
  if (url.origin !== self.location.origin) return;

  // HTML / navigation → network-first
  if (isNavigationRequest(req) || isHtmlPath(url)) {
    event.respondWith(networkFirstHtml(req));
    return;
  }

  // JS / CSS / images / manifest → stale-while-revalidate (fast + fresh)
  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Everything else same-origin: cache-first with network fallback
  event.respondWith(cacheFirst(req));
});
