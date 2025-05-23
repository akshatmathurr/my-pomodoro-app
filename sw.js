const CACHE_NAME = 'pomodoro-timer-cache-v1';
// **IMPORTANT**: If you rename pomodoro_app.html to index.html, update it here too!
const urlsToCache = [
  'pomodoro_app.html', // Main HTML file
  'icon-192.png',
  'icon-512.png'
  // Add other local assets if any. CDN assets are usually handled by browser/CDN cache.
];

// Install event: open cache and add core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching core assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache core assets:', err);
      })
  );
  self.skipWaiting(); // Activate worker immediately
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim(); // Take control of all clients immediately
});

// Fetch event: serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', event => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Cache hit - return response
        if (cachedResponse) {
          return cachedResponse;
        }

        // Not in cache - fetch from network, then cache it
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            // Basic check for opaque responses (from CDNs without CORS) - don't cache them if they error.
            if (!networkResponse || networkResponse.status !== 200) {
                 if (networkResponse && networkResponse.type === 'opaque') {
                    // Opaque responses are cross-origin requests without CORS.
                    // We can't check their status, so we serve them but don't cache them if they might be errors.
                    return networkResponse;
                }
                // If it's not opaque and not status 200, it's an error.
                return networkResponse;
            }

            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetch failed for:', event.request.url, error);
        });
      })
  );
});