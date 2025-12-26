const CACHE_NAME = 'silent-guardian-v1';
const STATIC_ASSETS = [
    '/',
    '/favicon.ico',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // Cache core assets
            // Note: In a real Next.js app, we can't easily guess chunk names here without a build plugin.
            // We rely on runtime caching for those.
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. Static Assets (Next.js bundles, images) -> Cache First
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.match(/\.(png|jpg|jpeg|svg|ico)$/)
    ) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) return cachedResponse;

                return fetch(event.request).then((response) => {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return response;
                });
            })
        );
        return;
    }

    // 2. API calls or other Data -> Network First (fallback to nothing, we handle data in IndexDB)
    if (url.pathname.startsWith('/api/')) {
        // Let the browser handle strictly network, or custom logic
        return;
    }

    // 3. HTML Navigation -> Network First, fallback to Cache (Stale-while-revalidate strategy is also good)
    // For an offline-first app, we want to try to get the latest, but fallback to cached app shell.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    return caches.match(event.request).then((cachedResponse) => {
                        if (cachedResponse) return cachedResponse;
                        // Fallback to root if specific page not found (SPA behavior)
                        return caches.match('/');
                    });
                })
        );
        return;
    }
});
