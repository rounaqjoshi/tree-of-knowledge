// Kill-switch service worker.
// The previous design shipped a caching SW (cache "tok-v1") that serves the old
// site cache-first. This replacement deletes every cache and unregisters itself
// so returning visitors are not stuck on the stale cached design.
self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil((async function () {
    // Remove all caches (covers the old "tok-v1" cache and anything else).
    var keys = await caches.keys();
    await Promise.all(keys.map(function (k) { return caches.delete(k); }));
    // Tear down this registration entirely.
    await self.registration.unregister();
    // Only force a reload when we actually cleared a stale cache. This refreshes
    // returning visitors to the new design without causing a reload loop for
    // first-time visitors (who have nothing to clear).
    if (keys.length > 0) {
      var clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function (client) { client.navigate(client.url); });
    }
  })());
});

// No fetch handler: while briefly active, all requests go straight to the network.
