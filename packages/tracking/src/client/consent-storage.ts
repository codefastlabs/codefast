import type { ConsentRecord, ConsentStorage } from "#/core/consent";

/**
 * `localStorage`-backed consent storage. Corrupt state, a private-mode/quota error, or no
 * `window` (SSR) degrades to an in-memory record — the visitor's decision still applies
 * for the session instead of re-prompting in a loop. `subscribe` fires for same-tab
 * writes and, via the `storage` event, for decisions made in other tabs.
 */
export function createLocalStorageConsentStorage(storageKey: string): ConsentStorage {
  const listeners = new Set<() => void>();
  let memoryRecord: ConsentRecord | undefined;

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

        return raw ? (JSON.parse(raw) as ConsentRecord) : memoryRecord;
      } catch {
        return memoryRecord;
      }
    },
    save(record: ConsentRecord): void {
      if (typeof globalThis.window === "undefined") {
        return;
      }

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
