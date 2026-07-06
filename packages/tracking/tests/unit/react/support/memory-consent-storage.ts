import type { ConsentRecord, ConsentStorage } from "#/core/consent";

export function createMemoryConsentStorage(initial?: ConsentRecord): ConsentStorage {
  let record: ConsentRecord | undefined = initial;

  return {
    clear() {
      record = undefined;
    },
    load: () => record,
    save(next) {
      record = next;
    },
  };
}
