import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isTrackingAllowed, resolveInitialConsent } from "#/features/tracking/lib/consent";

const { getRequestHeader, hasGlobalPrivacyControlSignal } = vi.hoisted(() => ({
  getRequestHeader: vi.fn(),
  hasGlobalPrivacyControlSignal: vi.fn(() => false),
}));

vi.mock("@tanstack/react-start/server", () => ({ getRequestHeader }));
vi.mock(import("@codefast/tracking/client"), async (importOriginal) => ({
  ...(await importOriginal()),
  hasGlobalPrivacyControlSignal,
}));

/** Drives `resolveInitialConsent`'s region/mode resolution via the headers it reads. */
function mockRegion(countryCode: string | undefined, gpcHeader?: string): void {
  getRequestHeader.mockImplementation((name: string) => {
    if (name === "x-vercel-ip-country") {
      return countryCode;
    }

    return name === "sec-gpc" ? gpcHeader : undefined;
  });
}

function storeDecision(analytics: boolean, policyVersion = "1"): void {
  window.localStorage.setItem(
    "codefast-ui-consent",
    JSON.stringify({ decision: { ads: false, analytics }, policyVersion, timestamp: 0 }),
  );
}

describe("resolveInitialConsent", () => {
  afterEach(() => {
    getRequestHeader.mockReset();
  });

  it("falls back to the strictest default when there's no country header (build-time prerender)", () => {
    mockRegion(undefined);

    expect(resolveInitialConsent()).toEqual({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "other",
    });
  });

  it("resolves EU to opt-in with everything denied", () => {
    mockRegion("DE");

    expect(resolveInitialConsent()).toEqual({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "eu",
    });
  });

  it("resolves US to opt-out with analytics granted — ads is never requested here", () => {
    mockRegion("US");

    expect(resolveInitialConsent()).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });

  it("leaves analytics granted under a GPC signal — do-not-sell-or-share only covers ads", () => {
    mockRegion("US", "1");

    expect(resolveInitialConsent()).toEqual({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
  });
});

describe("isTrackingAllowed", () => {
  beforeEach(() => {
    hasGlobalPrivacyControlSignal.mockReturnValue(false);
    window.localStorage.removeItem("codefast-ui-consent");
    mockRegion("DE");
  });

  afterEach(() => {
    getRequestHeader.mockReset();
  });

  it("blocks tracking in an opt-in region until a decision exists", () => {
    expect(isTrackingAllowed()).toBe(false);
  });

  it("allows tracking in an opt-in region after a stored grant", () => {
    storeDecision(true);

    expect(isTrackingAllowed()).toBe(true);
  });

  it("blocks tracking in an opt-in region after a stored denial", () => {
    storeDecision(false);

    expect(isTrackingAllowed()).toBe(false);
  });

  it("allows tracking by default in an opt-out region", () => {
    mockRegion("US");

    expect(isTrackingAllowed()).toBe(true);
  });

  it("blocks tracking in an opt-out region after a stored denial", () => {
    mockRegion("US");
    storeDecision(false);

    expect(isTrackingAllowed()).toBe(false);
  });

  it("keeps analytics allowed under a GPC signal in an opt-out region — GPC only forces ads denied", () => {
    mockRegion("US");
    hasGlobalPrivacyControlSignal.mockReturnValue(true);

    expect(isTrackingAllowed()).toBe(true);
  });

  it("ignores a decision stored under an older policy version and re-applies the region default", () => {
    storeDecision(true, "0");

    expect(isTrackingAllowed()).toBe(false);
  });

  it("ignores a tampered record and re-applies the region default", () => {
    window.localStorage.setItem(
      "codefast-ui-consent",
      JSON.stringify({ decision: { analytics: "yes" }, policyVersion: "1", timestamp: 0 }),
    );

    expect(isTrackingAllowed()).toBe(false);
  });
});
