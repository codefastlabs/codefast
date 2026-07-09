import type { EventQueueStorage } from "#/client/queue";
import type { TrackedEvent } from "#/core/tracked-event";
import { isTrackedEvent } from "#/core/tracked-event";

/**
 * `localStorage`-backed queue storage — corrupt/missing state, a private-mode/quota
 * error, or no `window` (SSR) are all treated as empty rather than thrown, since a lost
 * offline queue is preferable to a crashing app.
 *
 * @since 0.5.0-canary.4
 */
export function createLocalStorageQueueStorage(storageKey: string): EventQueueStorage {
  return {
    load(): Array<TrackedEvent> {
      if (typeof globalThis.window === "undefined") {
        return [];
      }

      try {
        const raw = globalThis.window.localStorage.getItem(storageKey);

        if (!raw) {
          return [];
        }

        const parsed: unknown = JSON.parse(raw);

        // Drops pre-migration/malformed records here, at the source, so every reader
        // (queue flush, `createHttpDestination`, `flushWithBeacon`) sees only valid envelopes.
        return Array.isArray(parsed) ? parsed.filter(isTrackedEvent) : [];
      } catch {
        return [];
      }
    },
    save(events: Array<TrackedEvent>): void {
      if (typeof globalThis.window === "undefined") {
        return;
      }

      try {
        globalThis.window.localStorage.setItem(storageKey, JSON.stringify(events));
      } catch {
        /* storage blocked (private mode / quota) */
      }
    },
  };
}
