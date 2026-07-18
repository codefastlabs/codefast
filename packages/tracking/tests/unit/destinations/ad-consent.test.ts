import { describe, expect, it } from "vitest";

import { toAdConsentState } from "#/destinations/ad-consent";

describe("toAdConsentState", () => {
  it("drives transmission by analytics and LDU by !ads, as independent levers", () => {
    expect(toAdConsentState({ ads: true, analytics: true })).toEqual({
      limitedDataUse: false,
      transmissionAllowed: true,
    });
    // US opt-out: LDU on, but first-party analytics still transmits (spec-consent §3).
    expect(toAdConsentState({ ads: false, analytics: true })).toEqual({
      limitedDataUse: true,
      transmissionAllowed: true,
    });
    expect(toAdConsentState({ ads: true, analytics: false })).toEqual({
      limitedDataUse: false,
      transmissionAllowed: false,
    });
    expect(toAdConsentState({ ads: false, analytics: false })).toEqual({
      limitedDataUse: true,
      transmissionAllowed: false,
    });
  });
});
