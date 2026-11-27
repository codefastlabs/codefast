import { describe, expect, it, vi } from "vitest";

import { createLocalStorageConsentStorage } from "#client/consent-storage";
import { createEffectiveConsentReader } from "#client/effective-consent-reader";

describe("createEffectiveConsentReader", () => {
  it("follows the region default before a stored decision exists", () => {
    const storage = createLocalStorageConsentStorage("test-effective-consent");
    const getEffectiveConsent = createEffectiveConsentReader({
      config: { policyVersion: "1", requestedCategories: ["analytics"], storageKey: "test-effective-consent" },
      getMode: () => "opt-out",
      storage,
    });

    expect(getEffectiveConsent()).toEqual({ ads: false, analytics: true });
  });

  it("reads a stored analytics denial", () => {
    const storage = createLocalStorageConsentStorage("test-effective-consent-denied");
    storage.save({
      decision: { ads: false, analytics: false },
      policyVersion: "1",
      timestamp: Date.now(),
    });

    const getEffectiveConsent = createEffectiveConsentReader({
      config: {
        policyVersion: "1",
        requestedCategories: ["analytics"],
        storageKey: "test-effective-consent-denied",
      },
      getMode: () => "opt-out",
      storage,
    });

    expect(getEffectiveConsent()).toEqual({ ads: false, analytics: false });
  });

  it("re-applies the region default when the stored decision's policy version is superseded", () => {
    const storage = createLocalStorageConsentStorage("test-effective-consent-superseded");
    storage.save({ decision: { ads: false, analytics: true }, policyVersion: "0", timestamp: 0 });

    const getEffectiveConsent = createEffectiveConsentReader({
      config: {
        policyVersion: "1",
        requestedCategories: ["analytics"],
        storageKey: "test-effective-consent-superseded",
      },
      getMode: () => "opt-in",
      storage,
    });

    expect(getEffectiveConsent()).toEqual({ ads: false, analytics: false });
  });

  it("lets a GPC signal turned on after a stored grant revoke ads", () => {
    const storage = createLocalStorageConsentStorage("test-effective-consent-gpc-stored");
    storage.save({ decision: { ads: true, analytics: true }, policyVersion: "1", timestamp: 0 });
    let hasSignal = false;

    const getEffectiveConsent = createEffectiveConsentReader({
      config: {
        policyVersion: "1",
        requestedCategories: ["ads", "analytics"],
        storageKey: "test-effective-consent-gpc-stored",
      },
      getMode: () => "opt-out",
      hasGlobalPrivacyControlSignal: () => hasSignal,
      storage,
    });

    expect(getEffectiveConsent()).toEqual({ ads: true, analytics: true });

    hasSignal = true;

    expect(getEffectiveConsent()).toEqual({ ads: false, analytics: true });
  });

  it("re-reads mode and GPC on each call", () => {
    const storage = createLocalStorageConsentStorage("test-effective-consent-gpc");
    const getMode = vi.fn(() => "opt-out" as const);
    const hasGlobalPrivacyControlSignal = vi.fn(() => false);

    const getEffectiveConsent = createEffectiveConsentReader({
      config: {
        policyVersion: "1",
        requestedCategories: ["ads", "analytics"],
        storageKey: "test-effective-consent-gpc",
      },
      getMode,
      hasGlobalPrivacyControlSignal,
      storage,
    });

    expect(getEffectiveConsent()).toEqual({ ads: true, analytics: true });
    expect(getMode).toHaveBeenCalledOnce();
    expect(hasGlobalPrivacyControlSignal).toHaveBeenCalledOnce();

    getMode.mockClear();
    hasGlobalPrivacyControlSignal.mockClear();
    getEffectiveConsent();
    expect(getMode).toHaveBeenCalledOnce();
    expect(hasGlobalPrivacyControlSignal).toHaveBeenCalledOnce();
  });
});
