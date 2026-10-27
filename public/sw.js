const CACHE = "wasl-recipt-v2";
const ASSETS = [
  "/",
  "/icon-192.png",
  "/icon-512.png",
  "/wasl-logo.jpg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Let API requests bypass the cache
  if (request.url.includes("/api/")) return;

  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
