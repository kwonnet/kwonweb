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
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
