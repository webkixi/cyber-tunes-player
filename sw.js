const CACHE_NAME = 'cybertunes-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap'
];

// Install Event: Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// Fetch Event: Network First for API/Media, Cache First for Shell
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests like esm.sh for strict caching in this demo env, 
  // or simple fallback. For PWA, we try cache first, then network.
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Check if we received a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response (streams can only be consumed once)
        const responseToCache = response.clone();

        // Only cache requests to our own origin (or specific assets we trust)
        // In a real build step, we'd precache bundled JS. 
        // Here we cache dynamically visited assets if they match criteria.
        if (event.request.url.startsWith('http')) {
             caches.open(CACHE_NAME).then((cache) => {
                // Don't cache large media files (mp3) in the App Shell cache
                // usually done via Range requests or specific logic
                if (!event.request.url.endsWith('.mp3')) {
                    try {
                        cache.put(event.request, responseToCache);
                    } catch (e) {
                        // Quota exceeded or other error
                    }
                }
            });
        }

        return response;
      });
    })
  );
});