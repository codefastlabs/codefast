import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STRICTEST_INITIAL_CONSENT } from "#/features/tracking/lib/consent";
import {
  ensureVisitorConsentResolved,
  isTrackingAllowed,
  resetVisitorConsentForTests,
  useVisitorConsent,
  VISITOR_CONSENT_SESSION_KEY,
} from "#/features/tracking/lib/visitor-consent";

const { hasGlobalPrivacyControlSignal, resolveVisitorConsent } = vi.hoisted(() => ({
  hasGlobalPrivacyControlSignal: vi.fn(() => false),
  resolveVisitorConsent: vi.fn(),
}));

// The server-function network boundary — the store itself runs for real.
vi.mock("#/features/tracking/lib/resolve-visitor-consent", () => ({ resolveVisitorConsent }));
vi.mock(import("@codefast/tracking/client"), async (importOriginal) => ({
  ...(await importOriginal()),
  hasGlobalPrivacyControlSignal,
}));

const US_CONSENT = {
  defaultConsent: { ads: false, analytics: true },
  mode: "opt-out",
  region: "us",
} as const;

function storeDecision(analytics: boolean, policyVersion = "1"): void {
  window.localStorage.setItem(
    "codefast-ui-consent",
    JSON.stringify({ decision: { ads: false, analytics }, policyVersion, timestamp: 0 }),
  );
}

beforeEach(() => {
  resetVisitorConsentForTests();
  window.localStorage.clear();
  resolveVisitorConsent.mockReset();
  hasGlobalPrivacyControlSignal.mockReturnValue(false);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("useVisitorConsent / ensureVisitorConsentResolved", () => {
  it("starts from the strictest, unresolved default — what every cached render bakes", () => {
    const { result } = renderHook(() => useVisitorConsent());

    expect(result.current).toEqual({ initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: false });
  });

  it("publishes the server-resolved region default and caches it for the session", async () => {
    resolveVisitorConsent.mockResolvedValue(US_CONSENT);

    const { result } = renderHook(() => useVisitorConsent());

    ensureVisitorConsentResolved();

    await waitFor(() => {
      expect(result.current).toEqual({ initialConsent: US_CONSENT, isResolved: true });
    });
    expect(JSON.parse(window.sessionStorage.getItem(VISITOR_CONSENT_SESSION_KEY) ?? "")).toEqual(US_CONSENT);
    expect(resolveVisitorConsent).toHaveBeenCalledOnce();
  });

  it("reuses the session cache without a second server round trip", async () => {
    window.sessionStorage.setItem(VISITOR_CONSENT_SESSION_KEY, JSON.stringify(US_CONSENT));

    const { result } = renderHook(() => useVisitorConsent());

    ensureVisitorConsentResolved();

    await waitFor(() => {
      expect(result.current.isResolved).toBe(true);
    });
    expect(result.current.initialConsent).toEqual(US_CONSENT);
    expect(resolveVisitorConsent).not.toHaveBeenCalled();
  });

  it("ignores a tampered session cache and resolves over the server lane", async () => {
    window.sessionStorage.setItem(VISITOR_CONSENT_SESSION_KEY, JSON.stringify({ mode: "opt-out" }));
    resolveVisitorConsent.mockResolvedValue(US_CONSENT);

    const { result } = renderHook(() => useVisitorConsent());

    ensureVisitorConsentResolved();

    await waitFor(() => {
      expect(result.current.initialConsent).toEqual(US_CONSENT);
    });
  });

  it("fails closed: a failed resolution finalizes the strictest default so the consent UI still renders", async () => {
    resolveVisitorConsent.mockRejectedValue(new Error("offline"));

    const { result } = renderHook(() => useVisitorConsent());

    ensureVisitorConsentResolved();

    await waitFor(() => {
      expect(result.current).toEqual({ initialConsent: STRICTEST_INITIAL_CONSENT, isResolved: true });
    });
  });
});

describe("isTrackingAllowed", () => {
  async function resolveRegion(consent: typeof US_CONSENT | typeof STRICTEST_INITIAL_CONSENT): Promise<void> {
    resolveVisitorConsent.mockResolvedValue(consent);
    ensureVisitorConsentResolved();
    await waitFor(() => {
      expect(resolveVisitorConsent).toHaveBeenCalled();
    });
    // publish() runs in the resolution microtask — wait for the mode to land
    await vi.waitFor(() => {
      expect(isTrackingAllowed()).toBe(consent.mode === "opt-out");
    });
  }

  it("blocks tracking before the region resolves — the strictest default is opt-in with no decision", () => {
    expect(isTrackingAllowed()).toBe(false);
  });

  it("allows tracking by default once an opt-out region resolves", async () => {
    await resolveRegion(US_CONSENT);

    expect(isTrackingAllowed()).toBe(true);
  });

  it("blocks tracking in an opt-out region after a stored denial", async () => {
    await resolveRegion(US_CONSENT);
    storeDecision(false);

    expect(isTrackingAllowed()).toBe(false);
  });

  it("allows tracking in an opt-in region only after a stored grant", async () => {
    storeDecision(true);

    expect(isTrackingAllowed()).toBe(true);
  });

  it("ignores a grant stored under an older policy version", () => {
    storeDecision(true, "0");

    expect(isTrackingAllowed()).toBe(false);
  });

  it("keeps analytics allowed under a GPC signal in an opt-out region — GPC only covers ads", async () => {
    hasGlobalPrivacyControlSignal.mockReturnValue(true);
    await resolveRegion(US_CONSENT);

    expect(isTrackingAllowed()).toBe(true);
  });
});
