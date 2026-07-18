import { describe, expect, it } from "vitest";

import type { ConsentReceiptInput } from "#/core/consent-receipt";
import { isConsentReceiptInput } from "#/core/consent-receipt";

const validInput: ConsentReceiptInput = {
  decision: { ads: false, analytics: true },
  eventType: "give",
  method: "banner-accept",
  noticeLanguage: "en",
  noticeVersion: "banner-v3",
  policyVersion: "2026-05",
  subjectId: "6f1c2a4e-9b0d-4c3e-8f5a-1d2e3c4b5a69",
  subjectIdType: "cookie",
};

describe("isConsentReceiptInput", () => {
  it("accepts a well-formed input", () => {
    expect(isConsentReceiptInput(validInput)).toBe(true);
  });

  it("rejects a body carrying a full IP — the server owns IP derivation", () => {
    expect(isConsentReceiptInput({ ...validInput, ip: "203.0.113.7" })).toBe(false);
    expect(isConsentReceiptInput({ ...validInput, ipCoarse: "203.0.0.0" })).toBe(false);
  });

  it("rejects a malformed decision", () => {
    expect(isConsentReceiptInput({ ...validInput, decision: { ads: true } })).toBe(false);
  });

  it("rejects an unknown event type", () => {
    expect(isConsentReceiptInput({ ...validInput, eventType: "revoke" })).toBe(false);
  });

  it.each([undefined, null, "give", ["give"]])("rejects the non-object value %s", (value) => {
    expect(isConsentReceiptInput(value)).toBe(false);
  });
});
