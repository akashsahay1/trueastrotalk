
const CACHE_NAME = 'trueastrotalk-v2';
const STATIC_CACHE = 'trueastrotalk-static-v2';
const DYNAMIC_CACHE = 'trueastrotalk-dynamic-v2';

// Critical resources to cache immediately
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/lovable-uploads/e7ea263c-3fc3-4c24-a313-de804c9f1d3f.png',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=350&h=350&fit=crop&crop=face'
];

// Resources to cache on first request
const dynamicCacheUrls = [
  '/about/',
  '/services/',
  '/horoscope/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(urlsToCache);
      }),
      caches.open(DYNAMIC_CACHE) // Pre-create dynamic cache
    ])
  );
  // Skip waiting to activate new service worker immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clear old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle different types of requests
  if (request.method === 'GET') {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Return cached version if available
        if (cachedResponse) {
          // Update cache in background for dynamic content
          if (isDynamicContent(url.pathname)) {
            fetch(request).then((response) => {
              if (response.ok) {
                caches.open(DYNAMIC_CACHE).then((cache) => {
                  cache.put(request, response.clone());
                });
              }
            }).catch(() => {
              // Network failed, but we have cache
            });
          }
          return cachedResponse;
        }
        
        // Fetch from network and cache
        return fetch(request).then((response) => {
          // Only cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            const cacheType = isStaticContent(url.pathname) ? STATIC_CACHE : DYNAMIC_CACHE;
            
            caches.open(cacheType).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Network failed and no cache available
          if (url.pathname.startsWith('/')) {
            // Return offline page for navigation requests
            return caches.match('/');
          }
          throw new Error('Network request failed and no cache available');
        });
      })
    );
  }
});

// Helper functions
function isStaticContent(pathname) {
  return pathname.includes('/assets/') || 
         pathname.includes('/images/') || 
         pathname.includes('.css') || 
         pathname.includes('.js') ||
         pathname.includes('.png') ||
         pathname.includes('.jpg') ||
         pathname.includes('.svg');
}

function isDynamicContent(pathname) {
  return dynamicCacheUrls.some(url => pathname.startsWith(url));
}

// Background sync for offline functionality
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync
      console.log('Background sync triggered')
    );
  }
});
