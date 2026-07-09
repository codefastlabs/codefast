import type { ClientTracker } from "#/client/create-client-tracker";
import type { EventCatalog } from "#/core/event-catalog";

/**
 * @since 0.5.0-canary.4
 */
export interface ClientLifecycleOptions {
  /** `sendBeacon` target used on unload — omit to skip the unload flush entirely. */
  beaconEndpoint?: string | undefined;
  flushIntervalMs?: number | undefined;
}

/**
 * Wires the two flush triggers the queue itself can't own (batch-size is handled inside
 * `EventQueue`): a periodic interval flush, and a best-effort `sendBeacon` flush on
 * unload — `fetch` isn't reliable once the page starts unloading, `sendBeacon` is.
 * Returns a cleanup function to remove all listeners/timers.
 *
 * @since 0.5.0-canary.4
 */
export function attachClientLifecycle<Catalog extends EventCatalog>(
  tracker: Pick<ClientTracker<Catalog>, "flush" | "flushWithBeacon">,
  options: ClientLifecycleOptions = {},
): () => void {
  const flushIntervalMs = options.flushIntervalMs ?? 10_000;
  const intervalId = setInterval(() => {
    void tracker.flush();
  }, flushIntervalMs);

  function flushOnUnload(): void {
    if (options.beaconEndpoint !== undefined) {
      tracker.flushWithBeacon(options.beaconEndpoint);
    }
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === "hidden") {
      flushOnUnload();
    }
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", flushOnUnload);

  return () => {
    clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", flushOnUnload);
  };
}
