const CACHE = 'wup-maz-v1';

// Przy instalacji — pre-cache tylko statyczny shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      c.addAll(['/', '/index.html', '/manifest.webmanifest', '/logo.png'])
    )
  );
  self.skipWaiting();
});

// Przy aktywacji — usuń stare cache
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: zawsze świeże dane gdy online, fallback do cache offline
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Nie cachuj API ani zewnętrznych zasobów (czcionki itp.)
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
