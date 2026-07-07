import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ConsentBanner, ConsentToggle } from "#/react/consent-banner";
import type { UseConsentResult } from "#/react/use-consent";

function buildConsent(overrides: Partial<UseConsentResult> = {}): UseConsentResult {
  return {
    deny: vi.fn(),
    grant: vi.fn(),
    isTrackingAllowed: false,
    needsPrompt: true,
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

  it("calls grant/deny from the accept/reject buttons", async () => {
    const user = userEvent.setup();
    const consent = buildConsent();

    render(<ConsentBanner consent={consent} />);

    await user.click(screen.getByRole("button", { name: "Accept" }));
    expect(consent.grant).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Reject" }));
    expect(consent.deny).toHaveBeenCalledOnce();
  });
});

describe("ConsentToggle", () => {
  it("shows the deny label and calls deny() when tracking is currently allowed", async () => {
    const user = userEvent.setup();
    const consent = buildConsent({ isTrackingAllowed: true });

    render(<ConsentToggle consent={consent} />);

    const button = screen.getByRole("button", { name: /do not sell/i });

    await user.click(button);
    expect(consent.deny).toHaveBeenCalledOnce();
  });

  it("shows the allow label and calls grant() when tracking is currently denied", async () => {
    const user = userEvent.setup();
    const consent = buildConsent({ isTrackingAllowed: false });

    render(<ConsentToggle consent={consent} />);

    await user.click(screen.getByRole("button", { name: "Allow tracking" }));
    expect(consent.grant).toHaveBeenCalledOnce();
  });
});
