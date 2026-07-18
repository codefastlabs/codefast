import { describe, expect, it } from "vitest";

import type { ConsentReceipt } from "#/core/consent-receipt";
import { createInMemoryReceiptStore } from "#/server/consent-receipt-store";

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
