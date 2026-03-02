/// <reference lib="webworker" />

declare const __BUILD_ID__: string;

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

// Stable cache for /assets/* — content-hashed filenames are immutable,
// so these survive across deploys (avoids re-downloading the ~5MB dictionary)
const ASSETS_CACHE = 'ingglish-assets';
// Versioned cache for HTML and other mutable responses
const PAGES_CACHE = `ingglish-pages-${__BUILD_ID__}`;

// Install: activate immediately, no precaching
sw.addEventListener('install', () => {
  void sw.skipWaiting();
});

// Activate: delete old versioned caches (keep assets cache), claim clients
sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith('ingglish-pages-') && k !== PAGES_CACHE)
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

  // /assets/* — cache-first (content-hashed, immutable → stable cache)
  if (pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ASSETS_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) {
            return cached;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              void cache.put(request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // Everything else — network-first with cached fallback (versioned cache)
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          void caches.open(PAGES_CACHE).then((cache) => cache.put(request, clone));
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
