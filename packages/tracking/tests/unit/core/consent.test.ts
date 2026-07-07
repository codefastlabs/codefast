import { describe, expect, it } from "vitest";

import { createConsentDecision, isConsentDecision, resolveConsentMode, resolveDefaultConsent } from "#/core/consent";

describe("resolveConsentMode", () => {
  it.each([
    ["eu", "opt-in"],
    ["vn", "opt-in"],
    ["us", "opt-out"],
    ["other", "opt-out"],
  ] as const)("resolves %s to %s", (region, mode) => {
    expect(resolveConsentMode(region)).toBe(mode);
  });
});

describe("createConsentDecision", () => {
  it("grants exactly the given categories and denies the rest", () => {
    expect(createConsentDecision(["analytics"])).toEqual({ ads: false, analytics: true });
    expect(createConsentDecision(["ads", "analytics"])).toEqual({ ads: true, analytics: true });
    expect(createConsentDecision([])).toEqual({ ads: false, analytics: false });
  });
});

describe("isConsentDecision", () => {
  it("accepts a well-formed per-category decision", () => {
    expect(isConsentDecision({ ads: false, analytics: true })).toBe(true);
  });

  it("rejects the legacy granted/denied string shape", () => {
    expect(isConsentDecision("granted")).toBe(false);
    expect(isConsentDecision("denied")).toBe(false);
  });

  it("rejects records missing a category or holding non-boolean values", () => {
    expect(isConsentDecision({ analytics: true })).toBe(false);
    expect(isConsentDecision({ ads: "yes", analytics: true })).toBe(false);
    expect(isConsentDecision(null)).toBe(false);
    expect(isConsentDecision(undefined)).toBe(false);
  });
});

describe("resolveDefaultConsent", () => {
  it("denies everything under opt-in, regardless of GPC or requested categories", () => {
    expect(resolveDefaultConsent("opt-in", ["ads", "analytics"], false)).toEqual({ ads: false, analytics: false });
    expect(resolveDefaultConsent("opt-in", ["ads", "analytics"], true)).toEqual({ ads: false, analytics: false });
  });

  it("grants only the requested categories under opt-out", () => {
    expect(resolveDefaultConsent("opt-out", ["analytics"], false)).toEqual({ ads: false, analytics: true });
    expect(resolveDefaultConsent("opt-out", ["ads", "analytics"], false)).toEqual({ ads: true, analytics: true });
  });

  it("honors GPC as an ads opt-out — do-not-sell-or-share does not withdraw analytics", () => {
    expect(resolveDefaultConsent("opt-out", ["ads", "analytics"], true)).toEqual({ ads: false, analytics: true });
  });
});
