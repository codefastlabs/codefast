import { describe, expect, it } from "vitest";

import type { ConsentRecord } from "#/core/consent";
import { encodeConsentCookieValue } from "#/core/consent-cookie";
import { readConsentDecisionCookie, readConsentRecordCookie } from "#/server/consent-cookie";

function cookieHeader(record: ConsentRecord, cookieName = "consent"): string {
  return `theme=dark; ${cookieName}=${encodeConsentCookieValue(record)}; other=1`;
}

const record: ConsentRecord = {
  decision: { ads: false, analytics: true },
  policyVersion: "1",
  timestamp: 1_700_000_000_000,
};

describe("readConsentRecordCookie", () => {
  it("reads the mirrored record off a request Cookie header", () => {
    expect(readConsentRecordCookie(cookieHeader(record), "consent")).toEqual(record);
  });

  it("reads absence and malformed values as no record", () => {
    expect(readConsentRecordCookie(undefined, "consent")).toBeUndefined();
    expect(readConsentRecordCookie("consent=garbage", "consent")).toBeUndefined();
  });
});

describe("readConsentDecisionCookie", () => {
  it("returns the decision under the current policy version", () => {
    expect(
      readConsentDecisionCookie(cookieHeader(record), {
        decisionCookieName: "consent",
        policyVersion: "1",
        requestedCategories: ["analytics"],
        storageKey: "consent",
      }),
    ).toEqual({
      ads: false,
      analytics: true,
    });
  });

  it("reads a superseded policy version as no decision", () => {
    expect(
      readConsentDecisionCookie(cookieHeader(record), {
        decisionCookieName: "consent",
        policyVersion: "2",
        requestedCategories: ["analytics"],
        storageKey: "consent",
      }),
    ).toBeUndefined();
  });

  it("normalizes tampered extra keys away", () => {
    const tampered = { ...record, decision: { ads: true, analytics: true, tracking: true } } as ConsentRecord;
    const decision = readConsentDecisionCookie(cookieHeader(tampered), {
      decisionCookieName: "consent",
      policyVersion: "1",
      requestedCategories: ["analytics"],
      storageKey: "consent",
    });

    expect(decision).toEqual({ ads: true, analytics: true });
  });
});
