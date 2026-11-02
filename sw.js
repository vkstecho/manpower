const CACHE = 'mentor-pwa-v9-desktop-install';
const PRECACHE = [
  '/',
  '/mentor.html',
  '/manifest.json',
  '/css/guidance.css',
  '/assets/mentor-icon.jpg',
  '/icons/icon-512-maskable.png',
  '/icons/icon-192-maskable.png',
  '/icons/icon-512.png',
  '/icons/icon-192.png',
  '/icons/screenshot-wide.png',
  '/icons/screenshot-mobile.png',
  '/js/mg-config.js',
  '/js/mg-state.js',
  '/js/mg-auth.js',
  '/js/mg-data.js',
  '/js/mg-ui.js',
  '/js/mg-pwa.js',
  '/js/mg-tracks.js',
  '/js/mg-workspace.js',
  '/js/mg-mentor.js',
  '/js/mg-profile.js',
  '/js/mg-app.js'
];
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(PRECACHE.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url || '';
  const netFirst = /\.(html|js)(\?|$)/i.test(url) || url.endsWith('/') || url.includes('mentor.html') || url.includes('manifest.json');
  if (netFirst) {
    e.respondWith(
      fetch(e.request).then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        } catch (err) {}
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        try {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        } catch (err) {}
        return res;
      }).catch(() => hit);
    })
  );
});
