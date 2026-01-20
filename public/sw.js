// Service Worker for NivaasOne PWA
// Version: 1.0.0

const CACHE_NAME = 'nivaasone-v1';
const RUNTIME_CACHE = 'nivaasone-runtime-v1';

// Assets to cache on install (App Shell)
const APP_SHELL_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/_next/static/css/app/layout.css',
  '/manifest.json',
];

// Routes to cache (Dashboard pages, Sidebar, etc.)
const CACHE_ROUTES = [
  /^\/dashboard/,
  /^\/resident/,
  /^\/_next\/static/,
  /^\/icons/,
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL_ASSETS).catch((err) => {
        console.log('Cache install error:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
          })
          .map((cacheName) => {
            return caches.delete(cacheName);
          })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API calls (always use network)
  if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
    return;
  }

  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Check if route should be cached
  const shouldCache = CACHE_ROUTES.some((route) => route.test(url.pathname));

  if (shouldCache) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update in background
          fetch(request)
            .then((response) => {
              if (response && response.status === 200) {
                const responseToCache = response.clone();
                caches.open(RUNTIME_CACHE).then((cache) => {
                  cache.put(request, responseToCache);
                });
              }
            })
            .catch(() => {
              // Network error, use cache
            });
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
          .catch(() => {
            // Network error - return offline page if available
            if (request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
    );
  }
});

// Handle background sync (for future offline actions)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Future: sync offline actions
      Promise.resolve()
    );
  }
});

// Handle push notifications (for future)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
      })
    );
  }
});
