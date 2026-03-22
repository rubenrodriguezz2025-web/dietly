/**
 * Service Worker — PWA del paciente (Dietly)
 *
 * Estrategia de caché:
 *   /plan/[planId]     → network-first; cachear HTML por pathname (sin token en la key)
 *                        para soporte offline tras la primera visita.
 *   /_next/static/     → cache-first (assets del build, inmutables).
 *   /api/*             → NUNCA cachear (datos clínicos, Cache-Control: no-store).
 *   Resto              → network sin caché.
 *
 * Privacidad:
 *   - Sin Google Analytics, Meta Pixel ni tracking de terceros.
 *   - Los endpoints /api/ nunca se almacenan en caché local.
 *   - El token HMAC se omite de la cache key (se guarda solo por planId).
 */

const CACHE_VERSION = 'dietly-plan-v2';

// Recursos pre-cacheados en la instalación (mínimo necesario)
const PRECACHE_URLS = ['/manifest.json'];

// Patrones de URL
const PATRON_PLAN_NUEVO  = /^\/plan\//;         // nueva ruta HMAC
const PATRON_PLAN_LEGACY = /^\/p\//;            // ruta legacy (UUID directo)
const PATRON_ESTATICO    = /\/_next\/static\//; // assets del build (inmutables)
const PATRON_API         = /^\/api\//;          // endpoints de datos — NUNCA cachear

// ─── Instalación ─────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activación: limpiar versiones antiguas ───────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE_VERSION)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ────────────────────────────────────────────────────────────────────

self.addEventListener('fetch', (event) => {
  // Solo interceptar GET del mismo origen
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // ── /api/* — datos clínicos: NUNCA cachear ──────────────────────────────
  if (PATRON_API.test(url.pathname)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(
        () =>
          new Response(JSON.stringify({ error: 'Sin conexión' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          })
      )
    );
    return;
  }

  // ── /_next/static/ — assets inmutables: cache-first ────────────────────
  if (PATRON_ESTATICO.test(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(event.request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // ── /plan/[planId] — nueva ruta HMAC: network-first, offline por pathname ─
  if (PATRON_PLAN_NUEVO.test(url.pathname)) {
    // Cache key: solo el pathname, sin token/expires (datos sensibles en query)
    // Esto permite acceso offline independientemente de si el token ha rotado.
    const cacheKey = url.origin + url.pathname;

    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            // Guardar bajo la clave sin query params
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(cacheKey, clone));
          }
          return res;
        })
        .catch(() =>
          // Offline: servir desde caché si el paciente ya visitó el plan
          caches.match(cacheKey).then(
            (cached) =>
              cached ??
              new Response('Sin conexión. Abre el enlace cuando tengas internet.', {
                status: 503,
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
              })
          )
        )
    );
    return;
  }

  // ── /p/* — ruta legacy (UUID directo): misma estrategia network-first ───
  if (PATRON_PLAN_LEGACY.test(url.pathname)) {
    const cacheKey = url.origin + url.pathname;
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            caches.open(CACHE_VERSION).then((c) => c.put(cacheKey, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(cacheKey))
    );
    return;
  }

  // ── Resto: network sin caché ─────────────────────────────────────────────
  event.respondWith(fetch(event.request));
});
