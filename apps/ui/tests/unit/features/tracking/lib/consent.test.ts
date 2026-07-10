import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isTrackingAllowed, resolveInitialConsent } from "#/features/tracking/lib/consent";

const { hasGlobalPrivacyControlSignal } = vi.hoisted(() => ({
  hasGlobalPrivacyControlSignal: vi.fn(() => false),
}));

vi.mock(import("@codefast/tracking/client"), async (importOriginal) => ({
  ...(await importOriginal()),
  hasGlobalPrivacyControlSignal,
}));

function storeDecision(analytics: boolean, policyVersion = "1"): void {
  window.localStorage.setItem(
    "codefast-ui-consent",
    JSON.stringify({ decision: { ads: false, analytics }, policyVersion, timestamp: 0 }),
  );
}

describe("resolveInitialConsent", () => {
  // The server render is CDN-cached (ISR) and shared across visitors — a request-derived
  // value here would bake the first visitor's region into everyone's HTML. Per-visitor
  // personalization is middleware.ts's cookie, read client-side via __INITIAL_CONSENT__.
  it("bakes the strictest, visitor-independent default into the server render", () => {
    expect(resolveInitialConsent()).toEqual({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "other",
    });
  });
});

// This test env resolves the isomorphic fn to its server branch, so the mode is always the
// baked `"opt-in"`. Opt-out-mode gating lives in `createIsTrackingAllowed` and is covered
// by `@codefast/tracking`'s own unit tests; these cover this app's wiring around it.
describe("isTrackingAllowed", () => {
  beforeEach(() => {
    hasGlobalPrivacyControlSignal.mockReturnValue(false);
    window.localStorage.removeItem("codefast-ui-consent");
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("blocks tracking until a decision exists", () => {
    expect(isTrackingAllowed()).toBe(false);
  });

  it("allows tracking after a stored grant", () => {
    storeDecision(true);

    expect(isTrackingAllowed()).toBe(true);
  });

  it("blocks tracking after a stored denial", () => {
    storeDecision(false);

    expect(isTrackingAllowed()).toBe(false);
  });

  it("keeps a stored analytics grant under a GPC signal — do-not-sell-or-share only covers ads", () => {
    storeDecision(true);
    hasGlobalPrivacyControlSignal.mockReturnValue(true);

    expect(isTrackingAllowed()).toBe(true);
  });

  it("ignores a decision stored under an older policy version and re-applies the default", () => {
    storeDecision(true, "0");

    expect(isTrackingAllowed()).toBe(false);
  });

  it("ignores a tampered record and re-applies the default", () => {
    window.localStorage.setItem(
      "codefast-ui-consent",
      JSON.stringify({ decision: { analytics: "yes" }, policyVersion: "1", timestamp: 0 }),
    );

    expect(isTrackingAllowed()).toBe(false);
  });
});
