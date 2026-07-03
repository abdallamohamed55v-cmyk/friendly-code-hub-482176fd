/** @doc Cache kill-switch. Unregisters any existing app service worker and
 *  clears stale Cache Storage + localStorage build markers so returning
 *  users pick up the newest build immediately without a manual hard reload. */

const APP_SW_URLS = ["/sw.js", "/service-worker.js"];
const CACHE_BUSTER_KEY = "__megsy_cache_buster_v2";

async function unregisterAllServiceWorkers(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) return false;
  let hadAny = false;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const r of regs) {
      const url =
        r.active?.scriptURL ||
        r.installing?.scriptURL ||
        r.waiting?.scriptURL ||
        "";
      if (APP_SW_URLS.some((p) => url.endsWith(p))) {
        hadAny = true;
        try {
          await r.unregister();
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
  return hadAny;
}

async function clearAppCaches(): Promise<boolean> {
  if (typeof caches === "undefined") return false;
  let cleared = false;
  try {
    const names = await caches.keys();
    await Promise.allSettled(
      names.map((n) => {
        cleared = true;
        return caches.delete(n);
      }),
    );
  } catch {
    /* ignore */
  }
  return cleared;
}

export function registerAppServiceWorker(): void {
  if (typeof window === "undefined") return;

  const run = async () => {
    try {
      const hadSW = await unregisterAllServiceWorkers();
      const hadCaches = await clearAppCaches();

      // One-time forced reload for returning users that had stale SW/caches,
      // so the freshly fetched HTML/assets take over instantly.
      const marker = window.localStorage.getItem(CACHE_BUSTER_KEY);
      if ((hadSW || hadCaches) && marker !== "1") {
        window.localStorage.setItem(CACHE_BUSTER_KEY, "1");
        window.location.reload();
      } else if (!marker) {
        window.localStorage.setItem(CACHE_BUSTER_KEY, "1");
      }
    } catch {
      /* ignore */
    }
  };

  if (document.readyState === "complete") {
    void run();
  } else {
    window.addEventListener("load", () => void run(), { once: true });
  }
}
