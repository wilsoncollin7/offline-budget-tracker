
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
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// activate
self.addEventListener("activate", evt => {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// fetch
self.addEventListener('fetch', evt => {
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }
            return response;
          })
          .catch(err => {
            return cache.match(evt.request);
          });
      }).catch(err => console.log(err))
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
