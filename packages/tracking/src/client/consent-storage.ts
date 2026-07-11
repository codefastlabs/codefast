import type { ConsentRecord, ConsentStorage } from "#/core/consent";
import { isConsentRecord } from "#/core/consent";

/**
 * `localStorage`-backed consent storage. Corrupt state, a private-mode/quota error, or no
 * `window` (SSR) degrades to an in-memory record — the visitor's decision still applies
 * for the session instead of re-prompting in a loop. `subscribe` fires for same-tab
 * writes and, via the `storage` event, for decisions made in other tabs.
 *
 * `load()` parses and validates at most once per change: the result is cached and
 * invalidated by `save`/`clear` and by cross-tab `storage` events, so per-event consent
 * gates and per-render `useSyncExternalStore` snapshots cost a memory read, not a
 * `JSON.parse`.
 *
 * @remarks
 * The record persists as plain `JSON.stringify(ConsentRecord)` — a stable contract, so
 * pre-hydration inline scripts (e.g. a Consent Mode default bootstrap) can read the
 * decision synchronously before any tag fires.
 *
 * @since 0.5.0-canary.4
 */
export function createLocalStorageConsentStorage(storageKey: string): ConsentStorage {
  const listeners = new Set<() => void>();
  let memoryRecord: ConsentRecord | undefined;
  // Keyed by the raw string so ANY write path (save(), another tab, dev tools) is caught
  // by a cheap string compare — parse + validate re-run only when the value changed.
  let cache: { raw: string | null; record: ConsentRecord | undefined } | undefined;

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    clear(): void {
      if (typeof globalThis.window === "undefined") {
        return;
      }

      memoryRecord = undefined;
      cache = undefined;

      try {
        globalThis.window.localStorage.removeItem(storageKey);
      } catch {
        /* storage blocked (private mode / quota) */
      }

      notify();
    },
    load(): ConsentRecord | undefined {
      if (typeof globalThis.window === "undefined") {
        return undefined;
      }

      try {
        const raw = globalThis.window.localStorage.getItem(storageKey);

        if (cache && raw === cache.raw) {
          return cache.record;
        }

        let record: ConsentRecord | undefined;

        if (raw) {
          const parsed: unknown = JSON.parse(raw);

          // Drop malformed records at the source — mirrors the offline-queue storage guard.
          record = isConsentRecord(parsed) ? parsed : memoryRecord;
        } else {
          record = memoryRecord;
        }

        cache = { raw, record };

        return record;
      } catch {
        // Storage blocked — never seed the cache off an error path.
        return memoryRecord;
      }
    },
    save(record: ConsentRecord): void {
      if (typeof globalThis.window === "undefined") {
        return;
      }

      cache = undefined;

      try {
        globalThis.window.localStorage.setItem(storageKey, JSON.stringify(record));
        // localStorage is authoritative now — a lingering memory copy would shadow an
        // external clear (e.g. the visitor wiping site data).
        memoryRecord = undefined;
      } catch {
        // Storage blocked (private mode / quota) — keep the decision for this session.
        memoryRecord = record;
      }

      notify();
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);

      // The `storage` event only fires in *other* tabs; same-tab writes go through notify().
      function handleStorageEvent(event: StorageEvent): void {
        if (event.key === null || event.key === storageKey) {
          listener();
        }
      }

      if (typeof globalThis.window !== "undefined") {
        globalThis.window.addEventListener("storage", handleStorageEvent);
      }

      return () => {
        listeners.delete(listener);

        if (typeof globalThis.window !== "undefined") {
          globalThis.window.removeEventListener("storage", handleStorageEvent);
        }
      };
    },
  };
}
