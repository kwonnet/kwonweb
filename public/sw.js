self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {body: 'You have a new notification.'}; }
  const target = new URL(data.url || '/notifications', self.location.origin);
  event.waitUntil(self.registration.showNotification(data.title || 'Kwonnet', {
    body: data.body || 'You have a new notification.',
    tag: data.tag || 'kwonnet-notification', icon: '/android-chrome-192x192.png',
    badge: '/android-chrome-192x192.png',
    data: {url: target.origin === self.location.origin ? target.href : self.location.origin + '/notifications'},
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const target = new URL(event.notification.data?.url || '/notifications', self.location.origin);
    if (target.origin !== self.location.origin) return;
    const windows = await self.clients.matchAll({type: 'window', includeUncontrolled: true});
    for (const client of windows) {
      if (new URL(client.url).origin !== target.origin) continue;
      try {
        const navigated = await client.navigate(target.href);
        if (navigated) {await navigated.focus().catch(() => undefined); return;}
      } catch { /* A closing or unavailable tab must not prevent opening the post. */ }
    }
    return self.clients.openWindow(target.href);
  })());
});
// Cache only this explicit public allowlist. Never store navigations, API/RSC
// responses, user media, or authenticated HTML in Cache Storage.
const PWA_CACHE = 'kwonnet-pwa-v4';
const OFFLINE_URL = '/offline.html';
const PUBLIC_ASSETS = [OFFLINE_URL, '/android-chrome-192x192.png', '/android-chrome-512x512.png', '/apple-touch-icon.png'];
self.addEventListener('install', event => event.waitUntil((async () => {
  const cache = await caches.open(PWA_CACHE);
  await cache.addAll(PUBLIC_ASSETS.map(url => new Request(url, {cache: 'reload'})));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith('kwonnet-pwa-') && name !== PWA_CACHE).map(name => caches.delete(name)));
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try { return await fetch(request); }
      catch {
        return await caches.match(OFFLINE_URL, {cacheName: PWA_CACHE}) || new Response('Kwonnet is offline. Reconnect and try again.', {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8'}});
      }
    })());
  } else if (!url.search && PUBLIC_ASSETS.includes(url.pathname)) {
    event.respondWith(caches.match(request, {cacheName: PWA_CACHE}).then(cached => cached || fetch(request)));
  }
});
