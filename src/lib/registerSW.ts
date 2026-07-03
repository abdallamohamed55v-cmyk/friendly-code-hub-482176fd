/** @doc Guarded service-worker registration. Registers /sw.js only in production
 *  browser contexts (not Lovable preview, not iframe, not dev). Also honours
 *  a ?sw=off kill switch that unregisters any existing app service worker. */

const APP_SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;
  try {
    if (!import.meta.env.PROD) return true;
    if (window.self !== window.top) return true; // iframe (Lovable preview)

    const host = window.location.hostname;
    if (
      host.startsWith("id-preview--") ||
      host.startsWith("preview--") ||
      host === "lovableproject.com" ||
      host.endsWith(".lovableproject.com") ||
      host === "lovableproject-dev.com" ||
      host.endsWith(".lovableproject-dev.com") ||
      host === "beta.lovable.dev" ||
      host.endsWith(".beta.lovable.dev")
    ) {
      return true;
    }

    if (new URLSearchParams(window.location.search).get("sw") === "off") {
      return true;
    }
  } catch {
    return true;
  }
  return false;
}

async function unregisterAppServiceWorkers(): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(APP_SW_URL);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export function registerAppServiceWorker(): void {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  if (isRefusedContext()) {
    void unregisterAppServiceWorkers();
    return;
  }

  const register = () => {
    navigator.serviceWorker.register(APP_SW_URL, { scope: "/" }).catch(() => {
      /* ignore registration errors — offline is best-effort */
    });
  };

  if (document.readyState === "complete") {
    register();
  } else {
    window.addEventListener("load", register, { once: true });
  }
}
