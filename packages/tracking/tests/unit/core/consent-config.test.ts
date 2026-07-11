import { describe, expect, it } from "vitest";

import { defineConsentConfig } from "#/core/consent-config";

describe("defineConsentConfig", () => {
  it("returns the exact object it was given — an inference helper, not a builder", () => {
    const config = {
      policyVersion: "1",
      requestedCategories: ["analytics"] as const,
      storageKey: "consent",
    };

    expect(defineConsentConfig(config)).toBe(config);
  });
});
