import { describe, expect, it } from "vitest";

import { hasGppApi, hasTcfApi, reconcileAdFrameworkConsent } from "#/client/ad-framework-consent";

const NATIVE = { ads: true, analytics: true } as const;

describe("reconcileAdFrameworkConsent", () => {
  it("V1 — no CMP: the resolver is inert and native consent governs", () => {
    expect(reconcileAdFrameworkConsent({ hasGlobalPrivacyControlSignal: false, native: NATIVE })).toEqual({
      ads: true,
      analytics: true,
    });
  });

  it("V2 — a ready CMP governing ads+analytics overrides native for its categories", () => {
    expect(
      reconcileAdFrameworkConsent({
        cmp: { decision: { ads: true, analytics: true }, governs: ["ads", "analytics"], status: "ready" },
        hasGlobalPrivacyControlSignal: false,
        native: { ads: false, analytics: false },
      }),
    ).toEqual({ ads: true, analytics: true });
  });

  it("V3 — a detected but not-yet-loaded CMP fails closed on its governed categories", () => {
    expect(
      reconcileAdFrameworkConsent({
        cmp: { governs: ["ads", "analytics"], status: "loading" },
        hasGlobalPrivacyControlSignal: false,
        native: NATIVE,
      }),
    ).toEqual({ ads: false, analytics: false });
  });

  it("V4 — a GPP US sale/share opt-out sets ads=false and leaves first-party analytics", () => {
    expect(
      reconcileAdFrameworkConsent({
        cmp: { decision: { ads: false }, governs: ["ads"], status: "ready" },
        hasGlobalPrivacyControlSignal: false,
        native: NATIVE,
      }),
    ).toEqual({ ads: false, analytics: true });
  });

  it("V5 — native GPC tightens a CMP ads grant, never loosens it", () => {
    expect(
      reconcileAdFrameworkConsent({
        cmp: { decision: { ads: true }, governs: ["ads"], status: "ready" },
        hasGlobalPrivacyControlSignal: true,
        native: { ads: false, analytics: true },
      }),
    ).toEqual({ ads: false, analytics: true });
  });

  it("V6 — an out-of-scope CMP (gdprApplies=false) defers to native, never force-denies", () => {
    expect(
      reconcileAdFrameworkConsent({
        cmp: { governs: ["ads", "analytics"], status: "out-of-scope" },
        hasGlobalPrivacyControlSignal: false,
        native: NATIVE,
      }),
    ).toEqual({ ads: true, analytics: true });
  });
});

describe("hasTcfApi / hasGppApi", () => {
  it("detect the CMP read API by function presence without invoking it", () => {
    expect(hasTcfApi({ __tcfapi: () => undefined })).toBe(true);
    expect(hasTcfApi({})).toBe(false);
    expect(hasGppApi({ __gpp: () => undefined })).toBe(true);
    expect(hasGppApi({})).toBe(false);
  });
});
