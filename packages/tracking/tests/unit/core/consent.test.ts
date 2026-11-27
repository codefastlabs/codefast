import { describe, expect, it } from "vitest";

import {
  createConsentDecision,
  isConsentDecision,
  isConsentRecord,
  readStoredDecision,
  resolveConsentMode,
  resolveDefaultConsent,
  resolveEffectiveConsent,
} from "#core/consent";
import { createMemoryConsentStorage } from "#tests/unit/core/support/memory-consent-storage";

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

describe("isConsentRecord", () => {
  it("accepts a well-formed persisted record", () => {
    expect(isConsentRecord({ decision: { ads: false, analytics: true }, policyVersion: "1", timestamp: 0 })).toBe(true);
  });

  it("rejects malformed or incomplete records", () => {
    expect(isConsentRecord(null)).toBe(false);
    expect(isConsentRecord({ decision: { ads: false, analytics: true }, policyVersion: "1" })).toBe(false);
    expect(isConsentRecord({ decision: { ads: false }, policyVersion: "1", timestamp: 0 })).toBe(false);
  });
});

describe("resolveDefaultConsent", () => {
  it("denies everything under opt-in, regardless of GPC or requested categories", () => {
    expect(
      resolveDefaultConsent({
        hasGlobalPrivacyControlSignal: false,
        mode: "opt-in",
        requestedCategories: ["ads", "analytics"],
      }),
    ).toEqual({ ads: false, analytics: false });
    expect(
      resolveDefaultConsent({
        hasGlobalPrivacyControlSignal: true,
        mode: "opt-in",
        requestedCategories: ["ads", "analytics"],
      }),
    ).toEqual({ ads: false, analytics: false });
  });

  it("grants only the requested categories under opt-out", () => {
    expect(
      resolveDefaultConsent({
        hasGlobalPrivacyControlSignal: false,
        mode: "opt-out",
        requestedCategories: ["analytics"],
      }),
    ).toEqual({ ads: false, analytics: true });
    expect(
      resolveDefaultConsent({
        hasGlobalPrivacyControlSignal: false,
        mode: "opt-out",
        requestedCategories: ["ads", "analytics"],
      }),
    ).toEqual({ ads: true, analytics: true });
  });

  it("honors GPC as an ads opt-out — do-not-sell-or-share does not withdraw analytics", () => {
    expect(
      resolveDefaultConsent({
        hasGlobalPrivacyControlSignal: true,
        mode: "opt-out",
        requestedCategories: ["ads", "analytics"],
      }),
    ).toEqual({ ads: false, analytics: true });
  });
});

describe("readStoredDecision", () => {
  it("returns undefined when nothing is stored", () => {
    expect(readStoredDecision(createMemoryConsentStorage(), "1")).toBeUndefined();
  });

  it("returns the normalized decision when the policy version matches", () => {
    const storage = createMemoryConsentStorage({
      decision: { ads: false, analytics: true },
      policyVersion: "1",
      timestamp: 0,
    });

    expect(readStoredDecision(storage, "1")).toEqual({ ads: false, analytics: true });
  });

  it("drops tampered extra keys from the stored record", () => {
    const storage = createMemoryConsentStorage({
      decision: { ads: false, analytics: true, marketing: true } as never,
      policyVersion: "1",
      timestamp: 0,
    });

    expect(readStoredDecision(storage, "1")).toEqual({ ads: false, analytics: true });
  });

  it("ignores a decision recorded under a superseded policy version", () => {
    const storage = createMemoryConsentStorage({
      decision: { ads: false, analytics: true },
      policyVersion: "0",
      timestamp: 0,
    });

    expect(readStoredDecision(storage, "1")).toBeUndefined();
  });

  it("ignores a malformed decision shape", () => {
    const storage = createMemoryConsentStorage({
      decision: "granted" as never,
      policyVersion: "1",
      timestamp: 0,
    });

    expect(readStoredDecision(storage, "1")).toBeUndefined();
  });
});

describe("resolveEffectiveConsent", () => {
  it("falls back to the region default when nothing is stored", () => {
    expect(
      resolveEffectiveConsent({
        hasGlobalPrivacyControlSignal: false,
        mode: "opt-in",
        requestedCategories: ["analytics"],
        storedDecision: undefined,
      }),
    ).toEqual({ ads: false, analytics: false });
    expect(
      resolveEffectiveConsent({
        hasGlobalPrivacyControlSignal: false,
        mode: "opt-out",
        requestedCategories: ["analytics"],
        storedDecision: undefined,
      }),
    ).toEqual({ ads: false, analytics: true });
  });

  it("prefers the stored decision over the region default", () => {
    expect(
      resolveEffectiveConsent({
        hasGlobalPrivacyControlSignal: false,
        mode: "opt-out",
        requestedCategories: ["analytics"],
        storedDecision: { ads: false, analytics: false },
      }),
    ).toEqual({ ads: false, analytics: false });
  });

  it.each([
    ["opt-out", { ads: true, analytics: true }, false, { ads: true, analytics: true }],
    ["opt-out", { ads: true, analytics: true }, true, { ads: false, analytics: true }],
    ["opt-in", { ads: true, analytics: true }, true, { ads: false, analytics: true }],
    ["opt-out", { ads: false, analytics: true }, true, { ads: false, analytics: true }],
    ["opt-in", { ads: false, analytics: false }, false, { ads: false, analytics: false }],
    ["opt-in", { ads: true, analytics: false }, true, { ads: false, analytics: false }],
    ["opt-out", undefined, true, { ads: false, analytics: true }],
    ["opt-in", undefined, true, { ads: false, analytics: false }],
  ] as const)(
    "under %s tightens stored %o with GPC %s to %o",
    (mode, storedDecision, hasGlobalPrivacyControlSignal, expected) => {
      expect(
        resolveEffectiveConsent({
          hasGlobalPrivacyControlSignal,
          mode,
          requestedCategories: ["ads", "analytics"],
          storedDecision,
        }),
      ).toEqual(expected);
    },
  );

  it("returns an untouched stored decision as-is so a cached snapshot keeps its identity", () => {
    const storedDecision = { ads: true, analytics: true };

    expect(
      resolveEffectiveConsent({
        hasGlobalPrivacyControlSignal: false,
        mode: "opt-out",
        requestedCategories: ["analytics"],
        storedDecision,
      }),
    ).toBe(storedDecision);
  });
});
