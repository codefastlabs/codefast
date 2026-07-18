import { describe, expect, it, vi } from "vitest";

import type { ConsentReceipt } from "#/core/consent-receipt";
import type { ReceiptStoreBackend } from "#/server/consent-receipt-store";
import { createDurableReceiptStore, createInMemoryReceiptStore } from "#/server/consent-receipt-store";

function receipt(receiptId: string): ConsentReceipt {
  return {
    decision: { ads: false, analytics: true },
    eventType: "give",
    method: "banner-accept",
    noticeLanguage: "en",
    noticeVersion: "banner-v3",
    policyVersion: "2026-05",
    receiptId,
    schemaVersion: "1.0.0",
    subjectId: "6f1c2a4e-9b0d-4c3e-8f5a-1d2e3c4b5a69",
    subjectIdType: "cookie",
    timestamp: 1_752_796_800_000,
  };
}

describe("createInMemoryReceiptStore", () => {
  it("appends and reads back a receipt by id", async () => {
    const store = createInMemoryReceiptStore();

    await store.append(receipt("r1"));

    expect(await store.get("r1")).toMatchObject({ receiptId: "r1", eventType: "give" });
  });

  it("returns undefined for an unknown id", async () => {
    expect(await createInMemoryReceiptStore().get("missing")).toBeUndefined();
  });

  it("is append-only: re-appending the same id does not overwrite", async () => {
    const store = createInMemoryReceiptStore();

    await store.append(receipt("r1"));
    await store.append({ ...receipt("r1"), eventType: "withdraw" });

    expect(await store.get("r1")).toMatchObject({ eventType: "give" });
  });
});

/** An idempotent-by-id fake standing in for a real KV/Postgres client. */
function fakeBackend(): ReceiptStoreBackend & { records: Map<string, ConsentReceipt> } {
  const records = new Map<string, ConsentReceipt>();

  return {
    records,
    get: (receiptId) => Promise.resolve(records.get(receiptId)),
    put: (receiptId, value) => {
      if (!records.has(receiptId)) {
        records.set(receiptId, value);
      }

      return Promise.resolve();
    },
  };
}

describe("createDurableReceiptStore", () => {
  it("appends through the backend keyed by receiptId and reads back through it", async () => {
    const backend = fakeBackend();
    const store = createDurableReceiptStore({ backend });

    await store.append(receipt("r1"));

    expect(backend.records.get("r1")).toMatchObject({ receiptId: "r1", eventType: "give" });
    expect(await store.get("r1")).toMatchObject({ receiptId: "r1" });
  });

  it("delegates the read to the backend for an unknown id", async () => {
    const backend = fakeBackend();
    const get = vi.spyOn(backend, "get");

    expect(await createDurableReceiptStore({ backend }).get("missing")).toBeUndefined();
    expect(get).toHaveBeenCalledWith("missing");
  });

  it("preserves append-only when the backend is idempotent-by-id", async () => {
    const backend = fakeBackend();
    const store = createDurableReceiptStore({ backend });

    await store.append(receipt("r1"));
    await store.append({ ...receipt("r1"), eventType: "withdraw" });

    expect(await store.get("r1")).toMatchObject({ eventType: "give" });
  });
});
