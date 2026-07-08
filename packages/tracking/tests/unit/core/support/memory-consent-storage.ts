import type { ConsentRecord, ConsentStorage } from "#/core/consent";

export function createMemoryConsentStorage(initial?: ConsentRecord): ConsentStorage {
  const listeners = new Set<() => void>();
  let record: ConsentRecord | undefined = initial;

  function notify(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  return {
    clear() {
      record = undefined;
      notify();
    },
    load: () => record,
    save(next) {
      record = next;
      notify();
    },
    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
