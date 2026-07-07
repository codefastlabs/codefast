import type { ConsentRecord, ConsentStorage } from "#/core/consent";

/**
 * `localStorage`-backed consent storage — corrupt/missing state, a private-mode/quota
 * error, or no `window` (SSR — `useConsent` reads this synchronously during render, so
 * this runs on the server too) are all treated as "no decision yet" rather than thrown,
 * so a storage glitch degrades to re-prompting for consent instead of crashing the app.
 */
export function createLocalStorageConsentStorage(storageKey: string): ConsentStorage {
  return {
    clear(): void {
      if (typeof globalThis.window === "undefined") {
        return;
      }

      try {
        globalThis.window.localStorage.removeItem(storageKey);
      } catch {
        /* storage blocked (private mode / quota) */
      }
    },
    load(): ConsentRecord | undefined {
      if (typeof globalThis.window === "undefined") {
        return undefined;
      }

      try {
        const raw = globalThis.window.localStorage.getItem(storageKey);

        return raw ? (JSON.parse(raw) as ConsentRecord) : undefined;
      } catch {
        return undefined;
      }
    },
    save(record: ConsentRecord): void {
      if (typeof globalThis.window === "undefined") {
        return;
      }

      try {
        globalThis.window.localStorage.setItem(storageKey, JSON.stringify(record));
      } catch {
        /* storage blocked (private mode / quota) */
      }
    },
  };
}
