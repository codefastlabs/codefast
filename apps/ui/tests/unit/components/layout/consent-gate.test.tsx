import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConsentGate } from "#/components/layout/consent-gate";

const { clear, resolveInitialConsent, updateGoogleConsent } = vi.hoisted(() => ({
  clear: vi.fn(),
  resolveInitialConsent: vi.fn(),
  updateGoogleConsent: vi.fn(),
}));

vi.mock("#/lib/consent", () => ({
  CONSENT_POLICY_VERSION: "1",
  CONSENT_STORAGE_KEY: "codefast-ui-consent",
  REQUESTED_CONSENT_CATEGORIES: ["analytics"],
  resolveInitialConsent,
}));
vi.mock("#/lib/tracking", () => ({ getTracker: () => ({ clear }) }));
vi.mock("@codefast/tracking/destinations", () => ({ updateGoogleConsent }));

beforeEach(() => {
  clear.mockClear();
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
    resolveInitialConsent.mockReturnValue({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    render(<ConsentGate />);

    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
  });

  it("renders an always-visible Do Not Sell toggle for opt-out regions", () => {
    resolveInitialConsent.mockReturnValue({ defaultConsent: ANALYTICS_ONLY, mode: "opt-out", region: "us" });

    render(<ConsentGate />);

    expect(screen.getByRole("button", { name: /do not sell/i })).toBeTruthy();
  });

  it("clears the tracker's queue and revokes gtag consent on Reject", async () => {
    resolveInitialConsent.mockReturnValue({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(clear).toHaveBeenCalledOnce();
    expect(updateGoogleConsent).toHaveBeenCalledWith(DENIED);
  });

  it("updates gtag consent without clearing the tracker on Accept — analytics only, never ads", async () => {
    resolveInitialConsent.mockReturnValue({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(clear).not.toHaveBeenCalled();
    expect(updateGoogleConsent).toHaveBeenCalledWith(ANALYTICS_ONLY);
  });

  it("replays a stored grant to gtag on mount, without waiting for a new decision", () => {
    resolveInitialConsent.mockReturnValue({ defaultConsent: DENIED, mode: "opt-in", region: "eu" });
    window.localStorage.setItem(
      "codefast-ui-consent",
      JSON.stringify({ decision: ANALYTICS_ONLY, policyVersion: "1", timestamp: 0 }),
    );

    render(<ConsentGate />);

    expect(updateGoogleConsent).toHaveBeenCalledWith(ANALYTICS_ONLY);
  });

  it("syncs a denial made in another tab to gtag", () => {
    resolveInitialConsent.mockReturnValue({ defaultConsent: ANALYTICS_ONLY, mode: "opt-out", region: "us" });

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
