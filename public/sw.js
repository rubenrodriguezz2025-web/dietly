// Service Worker básico para la PWA del paciente
const CACHE_VERSION = 'dietly-plan-v1';
const ARCHIVOS_CACHE = ['/', '/manifest.json'];

// Instalación: pre-cachear recursos esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(ARCHIVOS_CACHE))
  );
  self.skipWaiting();
});

// Activación: limpiar cachés antiguas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((claves) =>
      Promise.all(
        claves
          .filter((clave) => clave !== CACHE_VERSION)
          .map((clave) => caches.delete(clave))
      )
    )
  );
  self.clients.claim();
});

// Fetch: estrategia network-first con fallback a caché
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET del mismo origen
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((respuesta) => {
        // Cachear respuestas válidas de páginas del plan
        if (respuesta.ok && url.pathname.startsWith('/p/')) {
          const copia = respuesta.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copia));
        }
        return respuesta;
      })
      .catch(() => {
        // Sin red: intentar desde caché
        return caches.match(event.request);
      })
  );
});
