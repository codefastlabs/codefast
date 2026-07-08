import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  ConsentBanner,
  ConsentBannerAccept,
  ConsentBannerActions,
  ConsentBannerCategory,
  ConsentBannerCustomize,
  ConsentBannerDescription,
  ConsentBannerPreferences,
  ConsentBannerReject,
  ConsentBannerSave,
  ConsentBannerTitle,
  ConsentToggle,
} from "#/react/consent-banner";
import type { UseConsentResult } from "#/react/use-consent";

function buildConsent(overrides: Partial<UseConsentResult> = {}): UseConsentResult {
  return {
    decision: undefined,
    denyAll: vi.fn(),
    effectiveConsent: { ads: false, analytics: false },
    grantAll: vi.fn(),
    isTrackingAllowed: false,
    isPromptNeeded: true,
    save: vi.fn(),
    ...overrides,
  };
}

function renderBanner(consent: UseConsentResult, open?: boolean) {
  return render(
    <ConsentBanner className="banner" consent={consent} open={open}>
      <ConsentBannerTitle>Cookies</ConsentBannerTitle>
      <ConsentBannerDescription>
        We use cookies. <a href="/privacy">Privacy policy</a>
      </ConsentBannerDescription>
      <ConsentBannerPreferences>
        <ConsentBannerCategory category="analytics">Analytics</ConsentBannerCategory>
        <ConsentBannerCategory category="ads">Advertising</ConsentBannerCategory>
        <ConsentBannerSave>Save preferences</ConsentBannerSave>
      </ConsentBannerPreferences>
      <ConsentBannerActions>
        <ConsentBannerAccept>Accept</ConsentBannerAccept>
        <ConsentBannerReject>Reject</ConsentBannerReject>
        <ConsentBannerCustomize>Customize</ConsentBannerCustomize>
      </ConsentBannerActions>
    </ConsentBanner>,
  );
}

describe("ConsentBanner", () => {
  it("renders nothing when the consent hook says no prompt is needed", () => {
    const { container } = renderBanner(buildConsent({ isPromptNeeded: false }));

    expect(container).toBeEmptyDOMElement();
  });

  it("renders despite isPromptNeeded=false when open overrides — the settings-panel case", () => {
    renderBanner(buildConsent({ isPromptNeeded: false }), true);

    expect(screen.getByRole("region", { name: "Cookie consent" })).toBeInTheDocument();
  });

  it("renders as a labeled region in the prompt state with data-slot hooks on every part", () => {
    renderBanner(buildConsent());

    const region = screen.getByRole("region", { name: "Cookie consent" });

    expect(region).toHaveClass("banner");
    expect(region).toHaveAttribute("data-state", "prompt");
    expect(region.querySelector('[data-slot="consent-title"]')).toBeInTheDocument();
    expect(region.querySelector('[data-slot="consent-description"]')).toBeInTheDocument();
    expect(region.querySelectorAll('[data-slot="consent-action"]')).toHaveLength(3);
    // the preferences layer stays closed until Customize opens it
    expect(region.querySelector('[data-slot="consent-preferences"]')).not.toBeInTheDocument();
  });

  it("hosts arbitrary markup, e.g. the privacy-policy link informed consent requires", () => {
    renderBanner(buildConsent());

    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/privacy");
  });

  it("wires Accept/Reject to grantAll/denyAll and composes the consumer's onClick", async () => {
    const user = userEvent.setup();
    const consent = buildConsent();
    const onAccept = vi.fn();

    render(
      <ConsentBanner consent={consent}>
        <ConsentBannerAccept onClick={onAccept}>Accept</ConsentBannerAccept>
        <ConsentBannerReject>Reject</ConsentBannerReject>
      </ConsentBanner>,
    );

    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(consent.grantAll).toHaveBeenCalledOnce();
    expect(onAccept).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(consent.denyAll).toHaveBeenCalledOnce();
  });

  it("saves a granular per-category choice through the preferences layer", async () => {
    const user = userEvent.setup();
    const consent = buildConsent();

    renderBanner(consent);

    await user.click(screen.getByRole("button", { name: "Customize" }));

    expect(screen.getByRole("region", { name: "Cookie consent" })).toHaveAttribute("data-state", "preferences");
    // Customize hides while its layer is open — Save takes over.
    expect(screen.queryByRole("button", { name: "Customize" })).not.toBeInTheDocument();

    // Nothing arrives pre-ticked in an opt-in region — pre-ticked consent is invalid under GDPR.
    expect(screen.getByRole("checkbox", { name: /analytics/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /advertising/i })).not.toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: /analytics/i }));
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(consent.save).toHaveBeenCalledWith({ ads: false, analytics: true });
  });

  it("throws when a part is rendered outside the ConsentBanner root", () => {
    // Suppress React's error boundary noise for the intentional throw.
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(() => render(<ConsentBannerAccept>Accept</ConsentBannerAccept>)).toThrow(/inside `ConsentBanner`/);
    error.mockRestore();
  });
});

describe("ConsentToggle", () => {
  it("shows the deny label and calls denyAll() while any category is effectively granted", async () => {
    const user = userEvent.setup();
    const consent = buildConsent({ effectiveConsent: { ads: false, analytics: true }, isTrackingAllowed: true });

    render(<ConsentToggle consent={consent} />);

    const button = screen.getByRole("button", { name: /do not sell/i });

    await user.click(button);
    expect(consent.denyAll).toHaveBeenCalledOnce();
  });

  it("shows the allow label and calls grantAll() when everything is denied", async () => {
    const user = userEvent.setup();
    const consent = buildConsent({ effectiveConsent: { ads: false, analytics: false } });

    render(<ConsentToggle consent={consent} />);

    await user.click(screen.getByRole("button", { name: "Allow tracking" }));
    expect(consent.grantAll).toHaveBeenCalledOnce();
  });
});
