import type * as TrackingClient from "@codefast/tracking/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { isTrackingAllowed } from "#/features/tracking/lib/consent-state";

const { hasGlobalPrivacyControlSignal, resolveInitialConsent } = vi.hoisted(() => ({
  hasGlobalPrivacyControlSignal: vi.fn(() => false),
  resolveInitialConsent: vi.fn(),
}));

vi.mock("#/features/tracking/lib/consent", () => ({
  CONSENT_POLICY_VERSION: "1",
  CONSENT_STORAGE_KEY: "codefast-ui-consent",
  REQUESTED_CONSENT_CATEGORIES: ["analytics"],
  resolveInitialConsent,
}));
vi.mock("@codefast/tracking/client", async (importOriginal) => ({
  ...(await importOriginal<typeof TrackingClient>()),
  hasGlobalPrivacyControlSignal,
}));

function storeDecision(analytics: boolean, policyVersion = "1"): void {
  window.localStorage.setItem(
    "codefast-ui-consent",
    JSON.stringify({ decision: { ads: false, analytics }, policyVersion, timestamp: 0 }),
  );
}

beforeEach(() => {
  hasGlobalPrivacyControlSignal.mockReturnValue(false);
  resolveInitialConsent.mockReturnValue({
    defaultConsent: { ads: false, analytics: false },
    mode: "opt-in",
    region: "eu",
  });
  window.localStorage.removeItem("codefast-ui-consent");
});

describe("isTrackingAllowed", () => {
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
    resolveInitialConsent.mockReturnValue({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });

    expect(isTrackingAllowed()).toBe(true);
  });

  it("blocks tracking in an opt-out region after a stored denial", () => {
    resolveInitialConsent.mockReturnValue({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
    storeDecision(false);

    expect(isTrackingAllowed()).toBe(false);
  });

  it("keeps analytics allowed under a GPC signal in an opt-out region — GPC only forces ads denied", () => {
    resolveInitialConsent.mockReturnValue({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });
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
