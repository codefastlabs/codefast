import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConsentGate } from "#/features/tracking/components/consent-gate";
import type { InitialConsent } from "#/features/tracking/lib/consent";

const { clear, clearAnonymousId, clearGoogleAnalyticsCookies, useVisitorConsent } = vi.hoisted(() => ({
  clear: vi.fn(),
  clearAnonymousId: vi.fn(),
  clearGoogleAnalyticsCookies: vi.fn(),
  useVisitorConsent: vi.fn(),
}));

vi.mock(import("#/features/tracking/lib/visitor-consent"), async (importOriginal) => ({
  ...(await importOriginal()),
  ensureVisitorConsentResolved: () => {},
  useVisitorConsent,
}));

/** Fakes the store as already resolved to this visitor's region default. */
function setRegion(initialConsent: InitialConsent): void {
  useVisitorConsent.mockReturnValue({ initialConsent, isResolved: true });
}

vi.mock("#/features/tracking/lib/tracking", () => ({
  clearAnonymousId,
  getTracker: () => ({ clear }),
}));
// Only the cookie clear is spied (jsdom's document.cookie is awkward to assert on);
// consent updates are asserted on the real gtag stub's dataLayer below.
vi.mock(import("@codefast/tracking/destinations"), async (importOriginal) => ({
  ...(await importOriginal()),
  clearGoogleAnalyticsCookies,
}));

/** Consent Mode `update` params pushed onto the real gtag stub's dataLayer, oldest first. */
function consentUpdates(): Array<Record<string, unknown>> {
  return (window.dataLayer ?? [])
    .map((entry) => Array.from(entry as ArrayLike<unknown>))
    .filter((entry) => entry[0] === "consent" && entry[1] === "update")
    .map((entry) => entry[2] as Record<string, unknown>);
}

const DENIED_PARAMS = {
  ad_personalization: "denied",
  ad_storage: "denied",
  ad_user_data: "denied",
  analytics_storage: "denied",
};
const ANALYTICS_ONLY_PARAMS = { ...DENIED_PARAMS, analytics_storage: "granted" };

beforeEach(() => {
  clear.mockClear();
  clearAnonymousId.mockClear();
  clearGoogleAnalyticsCookies.mockClear();
  window.dataLayer = [];
  window.localStorage.removeItem("codefast-ui-consent");
});

afterEach(() => {
  cleanup();
});

const DENIED = { ads: false, analytics: false };
const ANALYTICS_ONLY = { ads: false, analytics: true };

describe("ConsentGate", () => {
  it("renders a blocking accept/reject banner for opt-in regions", () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    render(<ConsentGate />);

    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
  });

  it("renders an always-visible analytics opt-out toggle for opt-out regions", () => {
    setRegion({ defaultConsent: ANALYTICS_ONLY, mode: "opt-out", region: "us" });

    render(<ConsentGate />);

    expect(screen.getByRole("button", { name: "Turn off analytics" })).toBeTruthy();
  });

  it("clears the tracker's queue, removes the anonymous id, and revokes gtag consent on Reject", async () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(clear).toHaveBeenCalledOnce();
    expect(clearAnonymousId).toHaveBeenCalledOnce();
    expect(clearGoogleAnalyticsCookies).toHaveBeenCalledOnce();
    expect(consentUpdates().at(-1)).toEqual(DENIED_PARAMS);
  });

  it("updates gtag consent without clearing the tracker on Accept — analytics only, never ads", async () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(clear).not.toHaveBeenCalled();
    expect(consentUpdates().at(-1)).toEqual(ANALYTICS_ONLY_PARAMS);
  });

  it("replays a stored grant to gtag on mount, without waiting for a new decision", () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });
    window.localStorage.setItem(
      "codefast-ui-consent",
      JSON.stringify({ decision: ANALYTICS_ONLY, policyVersion: "1", timestamp: 0 }),
    );

    render(<ConsentGate />);

    expect(consentUpdates().at(-1)).toEqual(ANALYTICS_ONLY_PARAMS);
  });

  it("keeps a persistent Cookie settings control after an opt-in decision and reopens the banner", async () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });
    window.localStorage.setItem(
      "codefast-ui-consent",
      JSON.stringify({ decision: ANALYTICS_ONLY, policyVersion: "1", timestamp: 0 }),
    );

    const user = userEvent.setup();

    render(<ConsentGate />);

    // Withdrawal must stay as easy as consent — no banner, but a way back in.
    expect(screen.queryByRole("button", { name: "Accept" })).toBeNull();

    await user.click(screen.getByRole("button", { name: "Cookie settings" }));
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(clear).toHaveBeenCalledOnce();
    expect(consentUpdates().at(-1)).toEqual(DENIED_PARAMS);
    expect(screen.getByRole("button", { name: "Cookie settings" })).toBeTruthy();
  });

  it("saves a granular choice through the Customize layer", async () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Customize" }));

    await user.click(screen.getByRole("checkbox", { name: /analytics/i }));
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(consentUpdates().at(-1)).toEqual(ANALYTICS_ONLY_PARAMS);
    expect(JSON.parse(window.localStorage.getItem("codefast-ui-consent") ?? "{}").decision).toEqual(ANALYTICS_ONLY);
  });

  it("links the privacy policy from the banner", () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    render(<ConsentGate />);

    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/privacy");
  });

  it("syncs a denial made in another tab to gtag and clears identity", () => {
    setRegion({ defaultConsent: ANALYTICS_ONLY, mode: "opt-out", region: "us" });

    render(<ConsentGate />);
    window.dataLayer = [];
    clear.mockClear();
    clearAnonymousId.mockClear();
    clearGoogleAnalyticsCookies.mockClear();

    act(() => {
      window.localStorage.setItem(
        "codefast-ui-consent",
        JSON.stringify({ decision: DENIED, policyVersion: "1", timestamp: 0 }),
      );
      window.dispatchEvent(new StorageEvent("storage", { key: "codefast-ui-consent" }));
    });

    expect(consentUpdates().at(-1)).toEqual(DENIED_PARAMS);
    expect(clear).toHaveBeenCalledOnce();
    expect(clearAnonymousId).toHaveBeenCalledOnce();
    expect(clearGoogleAnalyticsCookies).toHaveBeenCalledOnce();
  });
});
