import type { ConsentRecord, ConsentStorage } from "#/core/consent";

/**
 * `localStorage`-backed consent storage — corrupt/missing state is treated as "no
 * decision yet" rather than thrown, so a storage glitch degrades to re-prompting for
 * consent instead of crashing the app.
 */
export function createLocalStorageConsentStorage(storageKey: string): ConsentStorage {
  return {
    clear(): void {
      localStorage.removeItem(storageKey);
    },
    load(): ConsentRecord | undefined {
      const raw = localStorage.getItem(storageKey);

      if (!raw) {
        return undefined;
      }

      try {
        return JSON.parse(raw) as ConsentRecord;
      } catch {
        return undefined;
      }
    },
    save(record: ConsentRecord): void {
      localStorage.setItem(storageKey, JSON.stringify(record));
    },
  };
}
