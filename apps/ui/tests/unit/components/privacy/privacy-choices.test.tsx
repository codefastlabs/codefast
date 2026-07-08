import type * as TrackingClient from "@codefast/tracking/client";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PrivacyChoices } from "#/components/privacy/privacy-choices";

const { clear, hasGlobalPrivacyControlSignal, resolveInitialConsent } = vi.hoisted(() => ({
  clear: vi.fn(),
  hasGlobalPrivacyControlSignal: vi.fn(() => false),
  resolveInitialConsent: vi.fn(),
}));

vi.mock("#/lib/consent", () => ({
  CONSENT_POLICY_VERSION: "1",
  CONSENT_STORAGE_KEY: "codefast-ui-consent",
  REQUESTED_CONSENT_CATEGORIES: ["analytics"],
  resolveInitialConsent,
}));
vi.mock("#/lib/tracking", () => ({ getTracker: () => ({ clear }) }));
vi.mock("@codefast/tracking/client", async (importOriginal) => ({
  ...(await importOriginal<typeof TrackingClient>()),
  hasGlobalPrivacyControlSignal,
}));

beforeEach(() => {
  clear.mockClear();
  hasGlobalPrivacyControlSignal.mockReturnValue(false);
  window.localStorage.removeItem("codefast-ui-consent");
});

afterEach(() => {
  cleanup();
});

describe("PrivacyChoices", () => {
  it("reflects the effective consent in the switch and persists a denial", async () => {
    resolveInitialConsent.mockReturnValue({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });

    const user = userEvent.setup();

    render(<PrivacyChoices />);

    const analyticsSwitch = screen.getByRole("switch", { name: "Allow analytics" });

    expect(analyticsSwitch).toBeChecked();

    await user.click(analyticsSwitch);

    expect(analyticsSwitch).not.toBeChecked();
    expect(clear).toHaveBeenCalledOnce();
    expect(JSON.parse(window.localStorage.getItem("codefast-ui-consent") ?? "{}").decision).toEqual({
      ads: false,
      analytics: false,
    });
  });

  it("persists a grant when switched on in an opt-in region", async () => {
    resolveInitialConsent.mockReturnValue({
      defaultConsent: { ads: false, analytics: false },
      mode: "opt-in",
      region: "eu",
    });

    const user = userEvent.setup();

    render(<PrivacyChoices />);
    await user.click(screen.getByRole("switch", { name: "Allow analytics" }));

    expect(JSON.parse(window.localStorage.getItem("codefast-ui-consent") ?? "{}").decision).toEqual({
      ads: false,
      analytics: true,
    });
  });

  it("shows GPC as a read-only detection status, with enabling instructions when absent", () => {
    resolveInitialConsent.mockReturnValue({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });

    render(<PrivacyChoices />);

    expect(screen.getByText(/sending the GPC signal/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "globalprivacycontrol.org" })).toHaveAttribute(
      "href",
      "https://globalprivacycontrol.org",
    );
  });

  it("reports a detected GPC signal", () => {
    hasGlobalPrivacyControlSignal.mockReturnValue(true);
    resolveInitialConsent.mockReturnValue({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });

    render(<PrivacyChoices />);

    expect(screen.getByText(/signal detected/i)).toBeInTheDocument();
  });
});
