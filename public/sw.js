const CACHE_NAME = 'likhle-static-v0-6-6';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

function isStaticAsset(pathname) {
  return STATIC_ASSETS.includes(pathname);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('likhle-') && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }

      await self.clients.claim();
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.mode === 'navigate') {
    return;
  }

  if (!isStaticAsset(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response;
        }

        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
