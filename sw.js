const CACHE_NAME = 'pocketpop-cache-v1.7'; // Increment this version whenever you update assets/UI to force an immediate update toast for users.
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700;900&display=swap'
];

// Install event - cache assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Force fetching fresh assets from network during installation rather than using browser cache
      return Promise.all(
        ASSETS.map(asset => {
          return fetch(new Request(asset, { cache: 'reload' }))
            .then(response => {
              if (response.ok) {
                return cache.put(asset, response);
              }
              throw new Error(`Failed to fetch ${asset}`);
            })
            .catch(err => {
              console.warn(`Failed to cache ${asset} during install:`, err);
              // Fallback to caching normal request if cache: 'reload' fails (e.g. cross-origin CDN assets)
              return cache.add(asset);
            });
        })
      );
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', event => {
  // Only intercept GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude service worker file itself from being intercepted or cached
  if (url.pathname.endsWith('sw.js')) return;

  // Stale-While-Revalidate for local assets (same-origin)
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Ignore network errors (e.g., offline)
          });
          // Return the cached response immediately if it exists, otherwise wait for the network response
          return cachedResponse || fetchPromise;
        });
      })
    );
  } else {
    // Cache-First with network fallback for external assets (CDNs, Google Fonts)
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(response => {
          if (response && response.status === 200) {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, response.clone());
              return response;
            });
          }
          return response;
        }).catch(() => {
          // Offline fallback
        });
      })
    );
  }
});
