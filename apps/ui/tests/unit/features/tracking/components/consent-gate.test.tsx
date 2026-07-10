import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConsentGate } from "#/features/tracking/components/consent-gate";
import type { InitialConsent } from "#/features/tracking/lib/consent";

const { clear, clearAnonymousId, clearGoogleAnalyticsCookies, useVisitorConsent, updateGoogleConsent } = vi.hoisted(
  () => ({
    clear: vi.fn(),
    clearAnonymousId: vi.fn(),
    clearGoogleAnalyticsCookies: vi.fn(),
    useVisitorConsent: vi.fn(),
    updateGoogleConsent: vi.fn(),
  }),
);

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
// Withdrawal clears via the destinations barrel; gtag sync imports google-analytics
// directly inside `@codefast/tracking/react` — mock both so the same spies apply.
vi.mock(import("@codefast/tracking/destinations"), async (importOriginal) => ({
  ...(await importOriginal()),
  clearGoogleAnalyticsCookies,
  updateGoogleConsent,
}));
vi.mock(import("@codefast/tracking/destinations/google-analytics"), async (importOriginal) => ({
  ...(await importOriginal()),
  clearGoogleAnalyticsCookies,
  updateGoogleConsent,
}));

beforeEach(() => {
  clear.mockClear();
  clearAnonymousId.mockClear();
  clearGoogleAnalyticsCookies.mockClear();
  updateGoogleConsent.mockClear();
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
    expect(updateGoogleConsent).toHaveBeenCalledWith(DENIED);
  });

  it("updates gtag consent without clearing the tracker on Accept — analytics only, never ads", async () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(clear).not.toHaveBeenCalled();
    expect(updateGoogleConsent).toHaveBeenCalledWith(ANALYTICS_ONLY);
  });

  it("replays a stored grant to gtag on mount, without waiting for a new decision", () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });
    window.localStorage.setItem(
      "codefast-ui-consent",
      JSON.stringify({ decision: ANALYTICS_ONLY, policyVersion: "1", timestamp: 0 }),
    );

    render(<ConsentGate />);

    expect(updateGoogleConsent).toHaveBeenCalledWith(ANALYTICS_ONLY);
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
    expect(updateGoogleConsent).toHaveBeenLastCalledWith(DENIED);
    expect(screen.getByRole("button", { name: "Cookie settings" })).toBeTruthy();
  });

  it("saves a granular choice through the Customize layer", async () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Customize" }));

    await user.click(screen.getByRole("checkbox", { name: /analytics/i }));
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(updateGoogleConsent).toHaveBeenCalledWith(ANALYTICS_ONLY);
    expect(JSON.parse(window.localStorage.getItem("codefast-ui-consent") ?? "{}").decision).toEqual(ANALYTICS_ONLY);
  });

  it("links the privacy policy from the banner", () => {
    setRegion({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    render(<ConsentGate />);

    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/privacy");
  });

  it("syncs a denial made in another tab to gtag", () => {
    setRegion({ defaultConsent: ANALYTICS_ONLY, mode: "opt-out", region: "us" });

    render(<ConsentGate />);
    updateGoogleConsent.mockClear();

    act(() => {
      window.localStorage.setItem(
        "codefast-ui-consent",
        JSON.stringify({ decision: DENIED, policyVersion: "1", timestamp: 0 }),
      );
      window.dispatchEvent(new StorageEvent("storage", { key: "codefast-ui-consent" }));
    });

    expect(updateGoogleConsent).toHaveBeenCalledWith(DENIED);
  });
});
