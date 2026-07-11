import { describe, expect, it } from "vitest";

import type { ConsentRecord } from "#/core/consent";
import { decodeConsentCookieValue, encodeConsentCookieValue } from "#/core/consent-cookie";

const record: ConsentRecord = {
  decision: { ads: false, analytics: true },
  policyVersion: "1",
  timestamp: 1_700_000_000_000,
};

describe("consent cookie codec", () => {
  it("round-trips a record through the cookie wire format", () => {
    expect(decodeConsentCookieValue(encodeConsentCookieValue(record))).toEqual(record);
  });

  it("produces only RFC 6265 cookie-octets", () => {
    // Raw JSON would carry `"` and `,` — both illegal in a cookie value.
    expect(encodeConsentCookieValue(record)).toMatch(/^[!#-+\--:<-[\]-~]*$/);
  });

  it("reads a malformed encoding as no decision", () => {
    expect(decodeConsentCookieValue("%")).toBeUndefined();
    expect(decodeConsentCookieValue("not-json")).toBeUndefined();
  });

  it("reads a well-formed but wrong-shaped value as no decision", () => {
    expect(decodeConsentCookieValue(encodeURIComponent(JSON.stringify({ decision: { ads: "yes" } })))).toBeUndefined();
  });
});
