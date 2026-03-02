/// <reference lib="webworker" />

declare const __BUILD_ID__: string;

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

const CACHE_NAME = `ingglish-v1-${__BUILD_ID__}`;

// Install: activate immediately, no precaching
sw.addEventListener('install', () => {
  void sw.skipWaiting();
});

// Activate: delete old caches, claim clients
sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('ingglish-') && k !== CACHE_NAME)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => sw.clients.claim())
  );
});

// Fetch: same-origin GET only
sw.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;

  // Skip cross-origin and non-GET
  if (request.method !== 'GET' || new URL(request.url).origin !== sw.location.origin) {
    return;
  }

  const { pathname } = new URL(request.url);

  // build-id.txt must always hit network for update detection
  if (pathname === '/build-id.txt') {
    return;
  }

  // /assets/* — cache-first (content-hashed, immutable)
  if (pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Everything else — network-first with cached fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          void caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(
        () =>
          caches.match(request).then((cached) => {
            // SPA fallback: serve cached / for navigation requests
            if (cached) {
              return cached;
            }
            return caches.match('/');
          }) as Promise<Response>
      )
      .then((response) => response ?? new Response('Offline', { status: 503 }))
  );
});
