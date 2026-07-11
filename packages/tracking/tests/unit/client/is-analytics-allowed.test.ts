import { describe, expect, it, vi } from "vitest";

import { createLocalStorageConsentStorage } from "#/client/consent-storage";
import { createIsAnalyticsAllowed } from "#/client/is-analytics-allowed";

describe("createIsAnalyticsAllowed", () => {
  it("follows the region default before a stored decision exists", () => {
    const storage = createLocalStorageConsentStorage("test-is-analytics-allowed");
    const isAnalyticsAllowed = createIsAnalyticsAllowed({
      requestedCategories: ["analytics"],
      getMode: () => "opt-out",
      policyVersion: "1",
      storage,
    });

    expect(isAnalyticsAllowed()).toBe(true);
  });

  it("reads a stored analytics denial", () => {
    const storage = createLocalStorageConsentStorage("test-is-analytics-allowed-denied");
    storage.save({
      decision: { ads: false, analytics: false },
      policyVersion: "1",
      timestamp: Date.now(),
    });

    const isAnalyticsAllowed = createIsAnalyticsAllowed({
      requestedCategories: ["analytics"],
      getMode: () => "opt-out",
      policyVersion: "1",
      storage,
    });

    expect(isAnalyticsAllowed()).toBe(false);
  });

  it("re-reads mode and GPC on each call", () => {
    const storage = createLocalStorageConsentStorage("test-is-analytics-allowed-gpc");
    const getMode = vi.fn(() => "opt-out" as const);
    const getHasGlobalPrivacyControlSignal = vi.fn(() => false);

    const isAnalyticsAllowed = createIsAnalyticsAllowed({
      requestedCategories: ["ads", "analytics"],
      getMode,
      getHasGlobalPrivacyControlSignal,
      policyVersion: "1",
      storage,
    });

    expect(isAnalyticsAllowed()).toBe(true);
    expect(getMode).toHaveBeenCalledOnce();
    expect(getHasGlobalPrivacyControlSignal).toHaveBeenCalledOnce();

    getMode.mockClear();
    getHasGlobalPrivacyControlSignal.mockClear();
    expect(isAnalyticsAllowed()).toBe(true);
    expect(getMode).toHaveBeenCalledOnce();
    expect(getHasGlobalPrivacyControlSignal).toHaveBeenCalledOnce();
  });
});
