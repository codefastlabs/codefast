import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ConsentGate } from "#/components/layout/consent-gate";

const { clear, resolveInitialConsent, updateGoogleConsent } = vi.hoisted(() => ({
  clear: vi.fn(),
  resolveInitialConsent: vi.fn(),
  updateGoogleConsent: vi.fn(),
}));

vi.mock("#/lib/consent", () => ({ CONSENT_POLICY_VERSION: "1", resolveInitialConsent }));
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

describe("ConsentGate", () => {
  it("renders a blocking accept/reject banner for opt-in regions", () => {
    resolveInitialConsent.mockReturnValue({ defaultGranted: false, mode: "opt-in", region: "eu" });

    render(<ConsentGate />);

    expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reject" })).toBeTruthy();
  });

  it("renders an always-visible Do Not Sell toggle for opt-out regions", () => {
    resolveInitialConsent.mockReturnValue({ defaultGranted: true, mode: "opt-out", region: "us" });

    render(<ConsentGate />);

    expect(screen.getByRole("button", { name: /do not sell/i })).toBeTruthy();
  });

  it("clears the tracker's queue and revokes gtag consent on Reject", async () => {
    resolveInitialConsent.mockReturnValue({ defaultGranted: false, mode: "opt-in", region: "eu" });

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Reject" }));

    expect(clear).toHaveBeenCalledOnce();
    expect(updateGoogleConsent).toHaveBeenCalledWith(false);
  });

  it("updates gtag consent without clearing the tracker on Accept", async () => {
    resolveInitialConsent.mockReturnValue({ defaultGranted: false, mode: "opt-in", region: "eu" });

    const user = userEvent.setup();

    render(<ConsentGate />);
    await user.click(screen.getByRole("button", { name: "Accept" }));

    expect(clear).not.toHaveBeenCalled();
    expect(updateGoogleConsent).toHaveBeenCalledWith(true);
  });
});
