import { describe, expect, it } from "vitest";

import type { ConsentReceiptInput } from "#/core/consent-receipt";
import { buildConsentReceipt, coarsenIp, RECEIPT_SCHEMA_VERSION } from "#/server/consent-receipt";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const input: ConsentReceiptInput = {
  decision: { ads: false, analytics: true },
  eventType: "give",
  method: "banner-accept",
  noticeLanguage: "en",
  noticeVersion: "banner-v3",
  policyVersion: "2026-05",
  subjectId: "6f1c2a4e-9b0d-4c3e-8f5a-1d2e3c4b5a69",
  subjectIdType: "cookie",
};

describe("coarsenIp", () => {
  it("drops the last two octets of an IPv4 address", () => {
    expect(coarsenIp("203.0.113.7")).toBe("203.0.0.0");
  });

  it("keeps only the first two hextets of an IPv6 address", () => {
    expect(coarsenIp("2001:0db8:85a3:0000:0000:8a2e:0370:7334")).toBe("2001:0db8::");
  });

  it.each([undefined, null, "", "not-an-ip", "::"])("returns undefined for %s", (value) => {
    expect(coarsenIp(value)).toBeUndefined();
  });
});

describe("buildConsentReceipt", () => {
  it("stamps server-derived fields and preserves the input", () => {
    const receipt = buildConsentReceipt({ input, rawIp: "203.0.113.7" });

    expect(receipt.receiptId).toMatch(UUID_PATTERN);
    expect(receipt.schemaVersion).toBe(RECEIPT_SCHEMA_VERSION);
    expect(typeof receipt.timestamp).toBe("number");
    expect(receipt.ipCoarse).toBe("203.0.0.0");
    expect(receipt.decision).toEqual({ ads: false, analytics: true });
    expect(receipt.subjectId).toBe(input.subjectId);
    expect(receipt.integrityKey).toBeUndefined();
  });

  it("omits ipCoarse when no IP is available", () => {
    expect(buildConsentReceipt({ input }).ipCoarse).toBeUndefined();
  });

  it("stamps an integrityKey only when a signer is supplied", () => {
    const receipt = buildConsentReceipt({ input, sign: () => "signed" });

    expect(receipt.integrityKey).toBe("signed");
  });

  it("mints a fresh receiptId per call", () => {
    expect(buildConsentReceipt({ input }).receiptId).not.toBe(buildConsentReceipt({ input }).receiptId);
  });
});
