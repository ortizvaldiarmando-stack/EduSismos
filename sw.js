const CACHE_NAME = 'edusismos-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// INSTALACIÓN: guarda en caché los recursos estáticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ACTIVACIÓN: elimina cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// FETCH: responde desde caché y, si falla, intenta red
self.addEventListener('fetch', event => {
  // No interceptar peticiones a APIs externas (USGS, ipinfo, WhatsApp)
  const url = event.request.url;
  if (url.includes('earthquake.usgs.gov') ||
      url.includes('ipinfo.io') ||
      url.includes('wa.me') ||
      url.includes('whatsapp') ||
      url.includes('unpkg.com') ||
      url.includes('jsdelivr.net')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Guardar copia en caché para futuras visitas
        if (event.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Si todo falla y es navegación, devolver el index
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
