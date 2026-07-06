import type { EventQueueStorage } from "#/client/queue";
import type { TrackedEvent } from "#/core/tracked-event";

/**
 * `localStorage`-backed queue storage — corrupt/missing state is treated as empty
 * rather than thrown, since a lost offline queue is preferable to a crashing app.
 */
export function createLocalStorageQueueStorage(storageKey: string): EventQueueStorage {
  return {
    load(): Array<TrackedEvent> {
      const raw = localStorage.getItem(storageKey);

      if (!raw) {
        return [];
      }

      try {
        const parsed: unknown = JSON.parse(raw);

        return Array.isArray(parsed) ? (parsed as Array<TrackedEvent>) : [];
      } catch {
        return [];
      }
    },
    save(events: Array<TrackedEvent>): void {
      localStorage.setItem(storageKey, JSON.stringify(events));
    },
  };
}
