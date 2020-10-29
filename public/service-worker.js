
const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "db.js",
  "index.js",
  "manifest.webmanifest",
  "styles.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
]

const CACHE_NAME = "static-cache-v1";
const DATA_CACHE_NAME  = "runtime-cache";

// install
self.addEventListener("install", evt => {
  evt.waitUntil(
    caches
    .open(CACHE_NAME)
    .then(cache => cache.addAll(FILES_TO_CACHE))
    .then(() => self.skipWaiting())
  );
});

// activate
self.addEventListener("activate", evt => {
  const currentCaches = [CACHE_NAME, DATA_CACHE_NAME];
  evt.waitUntil(
    caches
    .keys()
    .then(cacheNames => {
      // return array of cache names that are old to delete
      return cacheNames.filter(
        cacheName => !currentCaches.includes(cacheName)
      );
    })
    .then(cachesDelete => {
      return Promise.all(
        cachesDelete.map(cacheDelete => {
          return caches.delete(cacheDelete);
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

// fetch
self.addEventListener('fetch', evt => {
  if (
    evt.request.method !== "GET" ||
    !evt.request.url.startsWith(self.location.origin)
  ) {
    evt.respondWith(fetch(evt.request));
    return;
  }

  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            cache.put(evt.request, response.clone());
            return response;
          })
          .catch(() => caches.match(evt.request));
      })
    );
    return;
  }

  evt.respondWith(
    caches.match(evt.request).then(response => {
      if (response) {
        return response;
      }

      // request is not in cache. make network request and cache the response
      return caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request).then(response => {
          return cache.put(evt.request, response.clone()).then(() => {
            return response;
          });
        });
      });
    })
  );
});
