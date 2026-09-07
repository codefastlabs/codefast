import { createHmac } from "node:crypto";

import type { ConsentReceipt } from "@codefast/tracking";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createReceiptSigner } from "#/features/tracking/lib/receipt-signer.server";

const SAMPLE: Omit<ConsentReceipt, "integrityKey"> = {
  decision: { ads: false, analytics: true },
  eventType: "give",
  method: "granular",
  noticeLanguage: "en",
  noticeVersion: "1",
  policyVersion: "1",
  receiptId: "00000000-0000-0000-0000-000000000000",
  schemaVersion: "1.0.0",
  subjectId: "11111111-1111-1111-1111-111111111111",
  subjectIdType: "cookie",
  timestamp: 0,
};

const originalSecret = process.env.CONSENT_RECEIPT_SECRET;

beforeEach(() => {
  delete process.env.CONSENT_RECEIPT_SECRET;
});

afterEach(() => {
  if (originalSecret === undefined) {
    delete process.env.CONSENT_RECEIPT_SECRET;
  } else {
    process.env.CONSENT_RECEIPT_SECRET = originalSecret;
  }
});

describe("createReceiptSigner", () => {
  it("returns undefined when the secret is unset, so receipts stay unsigned in dev", () => {
    expect(createReceiptSigner()).toBeUndefined();
  });

  it("produces the reproducible HMAC-SHA256 a verifier would compute", () => {
    process.env.CONSENT_RECEIPT_SECRET = "s3cret";
    const sign = createReceiptSigner();
    const expected = createHmac("sha256", "s3cret").update(JSON.stringify(SAMPLE)).digest("base64url");

    expect(sign?.(SAMPLE)).toBe(expected);
  });

  it("is deterministic for the same input and diverges on a different secret", () => {
    process.env.CONSENT_RECEIPT_SECRET = "key-a";
    const withKeyA = createReceiptSigner()?.(SAMPLE);

    process.env.CONSENT_RECEIPT_SECRET = "key-b";
    const withKeyB = createReceiptSigner()?.(SAMPLE);

    expect(withKeyA).toBe(createHmac("sha256", "key-a").update(JSON.stringify(SAMPLE)).digest("base64url"));
    expect(withKeyB).not.toBe(withKeyA);
  });
});
