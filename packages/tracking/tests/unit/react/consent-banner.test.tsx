import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConsentBanner, ConsentToggle } from "#/react/consent-banner";
import type { UseConsentResult } from "#/react/use-consent";

function buildConsent(overrides: Partial<UseConsentResult> = {}): UseConsentResult {
  return {
    decision: undefined,
    denyAll: vi.fn(),
    effectiveConsent: { ads: false, analytics: false },
    grantAll: vi.fn(),
    isTrackingAllowed: false,
    needsPrompt: true,
    save: vi.fn(),
    ...overrides,
  };
}

describe("ConsentBanner", () => {
  it("renders nothing when the consent hook says no prompt is needed", () => {
    const { container } = render(<ConsentBanner consent={buildConsent({ needsPrompt: false })} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders as a labeled region with data-slot styling hooks on every part", () => {
    render(<ConsentBanner className="banner" consent={buildConsent()} />);

    const region = screen.getByRole("region", { name: "Cookie consent" });

    expect(region).toHaveClass("banner");
    expect(region.querySelector('[data-slot="consent-message"]')).toBeInTheDocument();
    expect(region.querySelectorAll('[data-slot="consent-action"]')).toHaveLength(2);
  });

  it("accepts a rich message node so the privacy-policy link can live inside it", () => {
    render(
      <ConsentBanner
        consent={buildConsent()}
        message={
          <>
            We use cookies. <a href="/privacy">Privacy policy</a>
          </>
        }
      />,
    );

    expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute("href", "/privacy");
  });

  it("calls grantAll/denyAll from the accept/reject buttons", async () => {
    const user = userEvent.setup();
    const consent = buildConsent();

    render(<ConsentBanner consent={consent} />);

    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(consent.grantAll).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(consent.denyAll).toHaveBeenCalledOnce();
  });

  it("shows no customize button without the categories prop", () => {
    render(<ConsentBanner consent={buildConsent()} />);

    expect(screen.queryByRole("button", { name: "Customize" })).not.toBeInTheDocument();
  });

  it("saves a granular per-category choice through the preferences layer", async () => {
    const user = userEvent.setup();
    const consent = buildConsent();

    render(
      <ConsentBanner
        categories={[
          { category: "analytics", description: "Helps us improve the site.", label: "Analytics" },
          { category: "ads", label: "Advertising" },
        ]}
        consent={consent}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Customize" }));

    // Nothing arrives pre-ticked in an opt-in region — pre-ticked consent is invalid under GDPR.
    expect(screen.getByRole("checkbox", { name: /analytics/i })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: /advertising/i })).not.toBeChecked();

    await user.click(screen.getByRole("checkbox", { name: /analytics/i }));
    await user.click(screen.getByRole("button", { name: "Save preferences" }));

    expect(consent.save).toHaveBeenCalledWith({ ads: false, analytics: true });
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
