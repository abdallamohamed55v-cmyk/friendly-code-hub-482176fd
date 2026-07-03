// Kill-switch service worker: clears old caches and unregisters itself.
// Shipped to evict stale PWA caches for returning users.

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) =>
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        // Only clear this SW's own caches (workbox/precache/runtime buckets).
        const scope = self.registration.scope;
        const ours = cacheNames.filter(
          (name) =>
            /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)workbox-/.test(name) &&
            (name.endsWith(scope) || name.includes(new URL(scope).host)),
        );
        // Also clear any cache that looks app-shell related
        const appish = cacheNames.filter((n) =>
          /^(app-|html-|assets-|static-|pages-|megsy)/i.test(n),
        );
        await Promise.allSettled(
          [...new Set([...ours, ...appish])].map((n) => caches.delete(n)),
        );
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: "window" });
        await Promise.allSettled(
          windowClients.map((client) => client.navigate(client.url)),
        );
      } finally {
        await self.registration.unregister();
      }
    })(),
  ),
);

self.addEventListener("fetch", () => {
  // No-op: let the network handle everything while we tear down.
});
