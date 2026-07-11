import type { ClientTracker } from "#/client/create-client-tracker";
import type { EventCatalog } from "#/core/event-catalog";

/**
 * @since 0.5.0-canary.4
 */
export interface ClientLifecycleOptions {
  /**
   * `sendBeacon` target used on unload — omit to fall back to a keepalive `fetch` flush
   * through the queue's own destinations.
   */
  beaconEndpoint?: string | undefined;
}

/**
 * Wires the flush triggers the queue can't own itself (batch-size and idle-delay flushes
 * live inside `EventQueue`): end-of-session delivery on hide/pagehide — `sendBeacon` to
 * `beaconEndpoint` when set, else a keepalive flush so in-flight requests survive the
 * dismissal — and an immediate flush when connectivity returns, pairing with the queue's
 * own offline guard. Returns a cleanup function that removes every listener.
 *
 * @since 0.5.0-canary.4
 */
export function attachClientLifecycle<Catalog extends EventCatalog>(
  tracker: Pick<ClientTracker<Catalog>, "flush" | "flushWithBeacon">,
  options: ClientLifecycleOptions = {},
): () => void {
  function flushOnUnload(): void {
    if (options.beaconEndpoint === undefined) {
      void tracker.flush({ keepalive: true });

      return;
    }

    tracker.flushWithBeacon(options.beaconEndpoint);
  }

  function handleVisibilityChange(): void {
    if (document.visibilityState === "hidden") {
      flushOnUnload();
    }
  }

  function handleOnline(): void {
    void tracker.flush();
  }

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("pagehide", flushOnUnload);
  window.addEventListener("online", handleOnline);

  return () => {
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("pagehide", flushOnUnload);
    window.removeEventListener("online", handleOnline);
  };
}
