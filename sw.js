// Recomp service worker — yalnızca bildirimleri gösterir; uygulama kodu içermez.
const BASE = '/spor/'

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  const title = data.title || 'Recomp'
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: BASE + 'icons/icon-192.png',
    badge: BASE + 'icons/badge-96.png',
    tag: data.tag || 'recomp',
    renotify: true,
    vibrate: [120, 60, 120],
    data: { url: data.url || BASE },
    actions: data.actions || [],
  }))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const base = event.notification.data && event.notification.data.url || BASE
  const action = event.action || ''
  const url = action ? `${BASE}?do=${encodeURIComponent(action)}` : base
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of all) {
      if (c.url.includes(BASE)) { await c.focus(); if (action) c.postMessage({ do: action }); return }
    }
    await self.clients.openWindow(url)
  })())
})
