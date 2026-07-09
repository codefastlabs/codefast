import { describe, expect, it, vi } from "vitest";

import { createLocalStorageConsentStorage } from "#/client/consent-storage";
import { createIsTrackingAllowed } from "#/client/is-tracking-allowed";

describe("createIsTrackingAllowed", () => {
  it("follows the region default before a stored decision exists", () => {
    const storage = createLocalStorageConsentStorage("test-is-tracking-allowed");
    const isTrackingAllowed = createIsTrackingAllowed({
      categories: ["analytics"],
      getMode: () => "opt-out",
      policyVersion: "1",
      storage,
    });

    expect(isTrackingAllowed()).toBe(true);
  });

  it("reads a stored analytics denial", () => {
    const storage = createLocalStorageConsentStorage("test-is-tracking-allowed-denied");
    storage.save({
      decision: { ads: false, analytics: false },
      policyVersion: "1",
      timestamp: Date.now(),
    });

    const isTrackingAllowed = createIsTrackingAllowed({
      categories: ["analytics"],
      getMode: () => "opt-out",
      policyVersion: "1",
      storage,
    });

    expect(isTrackingAllowed()).toBe(false);
  });

  it("re-reads mode and GPC on each call", () => {
    const storage = createLocalStorageConsentStorage("test-is-tracking-allowed-gpc");
    const getMode = vi.fn(() => "opt-out" as const);
    const hasGlobalPrivacyControlSignal = vi.fn(() => false);

    const isTrackingAllowed = createIsTrackingAllowed({
      categories: ["ads", "analytics"],
      getMode,
      hasGlobalPrivacyControlSignal,
      policyVersion: "1",
      storage,
    });

    expect(isTrackingAllowed()).toBe(true);
    expect(getMode).toHaveBeenCalledOnce();
    expect(hasGlobalPrivacyControlSignal).toHaveBeenCalledOnce();

    getMode.mockClear();
    hasGlobalPrivacyControlSignal.mockClear();
    expect(isTrackingAllowed()).toBe(true);
    expect(getMode).toHaveBeenCalledOnce();
    expect(hasGlobalPrivacyControlSignal).toHaveBeenCalledOnce();
  });
});
