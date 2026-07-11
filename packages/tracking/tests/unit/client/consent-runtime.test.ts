import { afterEach, describe, expect, it, vi } from "vitest";

import { createConsentRuntime } from "#/client/consent-runtime";
import type { InitialConsent } from "#/core/consent";

const OPT_OUT_US: InitialConsent = {
  defaultConsent: { ads: false, analytics: true },
  mode: "opt-out",
  region: "us",
};

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

afterEach(() => {
  window.localStorage.clear();
});

describe("createConsentRuntime", () => {
  it("persists decisions under the config's storage key", () => {
    const runtime = createConsentRuntime({
      config: { policyVersion: "1", requestedCategories: ["analytics"], storageKey: "runtime-consent" },
      resolveInitialConsent: () => Promise.resolve(OPT_OUT_US),
    });

    runtime.storage.save({ decision: { ads: false, analytics: true }, policyVersion: "1", timestamp: 0 });

    expect(window.localStorage.getItem("runtime-consent")).toContain('"analytics":true');
  });

  it("gates analytics on the strictest default until the server lane resolves, then on the resolved mode", async () => {
    const resolveInitialConsent = vi.fn(() => Promise.resolve(OPT_OUT_US));
    const runtime = createConsentRuntime({
      config: { policyVersion: "1", requestedCategories: ["analytics"], storageKey: "runtime-consent-gate" },
      resolveInitialConsent,
    });

    // Unresolved → strictest opt-in default → all denied.
    expect(runtime.isAnalyticsAllowed()).toBe(false);

    runtime.ensureInitialConsentResolved();
    await flushMicrotasks();

    // Resolved to a US opt-out default → the requested analytics category is granted.
    expect(resolveInitialConsent).toHaveBeenCalledOnce();
    expect(runtime.isAnalyticsAllowed()).toBe(true);
  });

  it("lets a stored denial win over the resolved opt-out default", async () => {
    const runtime = createConsentRuntime({
      config: { policyVersion: "1", requestedCategories: ["analytics"], storageKey: "runtime-consent-denied" },
      resolveInitialConsent: () => Promise.resolve(OPT_OUT_US),
    });

    runtime.ensureInitialConsentResolved();
    await flushMicrotasks();
    runtime.storage.save({ decision: { ads: false, analytics: false }, policyVersion: "1", timestamp: 0 });

    expect(runtime.isAnalyticsAllowed()).toBe(false);
  });
});
