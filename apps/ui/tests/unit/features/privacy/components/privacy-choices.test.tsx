import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PrivacyChoices } from "#/features/privacy/components/privacy-choices";
import type { InitialConsent } from "#/features/tracking/lib/consent";

const {
  clearAnonymousId,
  clearGoogleAnalyticsCookies,
  currentAnonymousId,
  getAnonymousId,
  hasGlobalPrivacyControlSignal,
  useVisitorConsent,
  useHasHydrated,
} = vi.hoisted(() => ({
  clearAnonymousId: vi.fn(),
  clearGoogleAnalyticsCookies: vi.fn(),
  currentAnonymousId: vi.fn<() => string | undefined>(() => undefined),
  getAnonymousId: vi.fn<() => string>(() => "11111111-1111-4111-8111-111111111111"),
  hasGlobalPrivacyControlSignal: vi.fn(() => false),
  useVisitorConsent: vi.fn(),
  useHasHydrated: vi.fn(() => true),
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
  currentAnonymousId,
  getAnonymousId,
}));
vi.mock(import("@codefast/tracking/client/gpc"), async (importOriginal) => ({
  ...(await importOriginal()),
  hasGlobalPrivacyControlSignal,
}));
vi.mock(import("@codefast/tracking/destinations/google-analytics"), async (importOriginal) => ({
  ...(await importOriginal()),
  clearGoogleAnalyticsCookies,
}));
vi.mock("#/hooks/use-has-hydrated", () => ({ useHasHydrated }));

beforeEach(() => {
  clearAnonymousId.mockClear();
  clearGoogleAnalyticsCookies.mockClear();
  hasGlobalPrivacyControlSignal.mockReturnValue(false);
  useHasHydrated.mockReturnValue(true);
  window.localStorage.removeItem("codefast-ui-consent");
});

afterEach(() => {
  cleanup();
});

describe("PrivacyChoices", () => {
  it("reflects the effective consent in the switch and persists a denial", async () => {
    setRegion({
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
    expect(clearAnonymousId).toHaveBeenCalledOnce();
    expect(JSON.parse(window.localStorage.getItem("codefast-ui-consent") ?? "{}").decision).toEqual({
      ads: false,
      analytics: false,
    });
  });

  it("persists a grant when switched on in an opt-in region", async () => {
    setRegion({
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
    setRegion({
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
    setRegion({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });

    render(<PrivacyChoices />);

    expect(screen.getByText(/signal detected/i)).toBeInTheDocument();
  });

  it("prerenders statically before hydration — disabled switch, generic GPC copy, no live claims", () => {
    useHasHydrated.mockReturnValue(false);
    hasGlobalPrivacyControlSignal.mockReturnValue(true);
    setRegion({
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    });

    render(<PrivacyChoices />);

    const analyticsSwitch = screen.getByRole("switch", { name: "Allow analytics" });

    expect(analyticsSwitch).toBeDisabled();
    expect(analyticsSwitch).not.toBeChecked();
    // browser-only state must not leak into static HTML, even when the signal is present
    expect(screen.queryByText(/signal detected/i)).toBeNull();
    expect(screen.getByText(/a browser setting that asks sites/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "globalprivacycontrol.org" })).toBeInTheDocument();
  });

  it("keeps the switch disabled until the region resolves — no opt-in/opt-out flash", () => {
    useHasHydrated.mockReturnValue(true);
    useVisitorConsent.mockReturnValue({
      initialConsent: {
        defaultConsent: { ads: false, analytics: false },
        mode: "opt-in",
        region: "other",
      },
      isResolved: false,
    });

    render(<PrivacyChoices />);

    const analyticsSwitch = screen.getByRole("switch", { name: "Allow analytics" });

    expect(analyticsSwitch).toBeDisabled();
    expect(analyticsSwitch).not.toBeChecked();
  });
});
