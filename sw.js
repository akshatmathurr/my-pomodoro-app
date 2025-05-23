{\rtf1\ansi\ansicpg1252\cocoartf2822
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww28600\viewh14520\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const CACHE_NAME = 'pomodoro-timer-cache-v1';\
// **IMPORTANT**: If you rename pomodoro_app.html to index.html, update it here too!\
const urlsToCache = [\
  'pomodoro_app.html', // Main HTML file\
  'icon-192.png',\
  'icon-512.png'\
  // Add other local assets if any. CDN assets are usually handled by browser/CDN cache.\
];\
\
// Install event: open cache and add core files\
self.addEventListener('install', event => \{\
  event.waitUntil(\
    caches.open(CACHE_NAME)\
      .then(cache => \{\
        console.log('Opened cache and caching core assets');\
        return cache.addAll(urlsToCache);\
      \})\
      .catch(err => \{\
        console.error('Failed to cache core assets:', err);\
      \})\
  );\
  self.skipWaiting(); // Activate worker immediately\
\});\
\
// Activate event: clean up old caches\
self.addEventListener('activate', event => \{\
  const cacheWhitelist = [CACHE_NAME];\
  event.waitUntil(\
    caches.keys().then(cacheNames => \{\
      return Promise.all(\
        cacheNames.map(cacheName => \{\
          if (cacheWhitelist.indexOf(cacheName) === -1) \{\
            console.log('Deleting old cache:', cacheName);\
            return caches.delete(cacheName);\
          \}\
        \})\
      );\
    \})\
  );\
  return self.clients.claim(); // Take control of all clients immediately\
\});\
\
// Fetch event: serve from cache if available, otherwise fetch from network\
self.addEventListener('fetch', event => \{\
  // We only want to cache GET requests.\
  if (event.request.method !== 'GET') \{\
    return;\
  \}\
\
  event.respondWith(\
    caches.match(event.request)\
      .then(cachedResponse => \{\
        // Cache hit - return response\
        if (cachedResponse) \{\
          return cachedResponse;\
        \}\
\
        // Not in cache - fetch from network, then cache it\
        return fetch(event.request).then(\
          networkResponse => \{\
            // Check if we received a valid response\
            // Basic check for opaque responses (from CDNs without CORS) - don't cache them if they error.\
            if (!networkResponse || networkResponse.status !== 200) \{\
                 if (networkResponse && networkResponse.type === 'opaque') \{\
                    // Opaque responses are cross-origin requests without CORS.\
                    // We can't check their status, so we serve them but don't cache them if they might be errors.\
                    // Or, you might choose to cache them anyway if you trust the source.\
                    // For simplicity here, just return it without caching.\
                    return networkResponse;\
                \}\
                // If it's not opaque and not status 200, it's an error.\
                return networkResponse;\
            \}\
\
\
            // IMPORTANT: Clone the response. A response is a stream\
            // and because we want the browser to consume the response\
            // as well as the cache consuming the response, we need\
            // to clone it so we have two streams.\
            const responseToCache = networkResponse.clone();\
\
            caches.open(CACHE_NAME)\
              .then(cache => \{\
                cache.put(event.request, responseToCache);\
              \});\
\
            return networkResponse;\
          \}\
        ).catch(error => \{\
          console.error('Fetch failed for:', event.request.url, error);\
          // Optionally, return a generic offline fallback page if one of urlsToCache fails\
          // For a single page app, if pomodoro_app.html is cached, it should work.\
        \});\
      \})\
  );\
\});}