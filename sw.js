const CACHE = 'totaltools-v1';
const ARCHIVOS = [
  '/Yapeclock/',
  '/Yapeclock/index.html',
  '/Yapeclock/asistencias.html',
  '/Yapeclock/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Para peticiones a APIs externas (Firebase, Anthropic) siempre ir a red
  if(e.request.url.includes('firebaseio.com') ||
     e.request.url.includes('anthropic.com')) {
    e.respondWith(fetch(e.request));
    return;
  }
  // Para el resto: cache first, luego red
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(resp => {
        if(!resp || resp.status !== 200) return resp;
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      });
    })
  );
});
