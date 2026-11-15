// Recomp service worker — uygulamanın ana ekrana yüklenebilmesi için; uygulama kodu içermez.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))
