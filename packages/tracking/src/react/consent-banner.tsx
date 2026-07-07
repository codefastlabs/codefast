import type { ComponentProps, ReactNode } from "react";

import type { UseConsentResult } from "#/react/use-consent";

export interface ConsentBannerProps extends Omit<ComponentProps<"section">, "children"> {
  acceptLabel?: string;
  consent: UseConsentResult;
  message?: string;
  rejectLabel?: string;
}

/**
 * Non-blocking opt-in prompt for GDPR/NĐ 13 regions — renders nothing once a decision
 * exists or the region defaults to opt-out (`consent.needsPrompt` covers both). Rendered
 * as a labeled region, not a `<dialog>`: an open non-modal dialog neither traps focus nor
 * blocks the page, so the dialog semantics would over-promise. No styling is baked in —
 * target the root via `className` and the parts via their `data-slot` attributes
 * (`consent-message`, `consent-actions`, `consent-action`).
 */
export function ConsentBanner({
  acceptLabel = "Accept",
  consent,
  message = "We use cookies to understand how you use this site.",
  rejectLabel = "Reject",
  ...props
}: ConsentBannerProps): ReactNode {
  if (!consent.needsPrompt) {
    return null;
  }

  return (
    <section aria-label="Cookie consent" data-slot="consent-banner" {...props}>
      <p data-slot="consent-message">{message}</p>
      <div data-slot="consent-actions">
        <button data-action="accept" data-slot="consent-action" onClick={consent.grant} type="button">
          {acceptLabel}
        </button>
        <button data-action="reject" data-slot="consent-action" onClick={consent.deny} type="button">
          {rejectLabel}
        </button>
      </div>
    </section>
  );
}

export interface ConsentToggleProps extends Omit<ComponentProps<"button">, "children" | "onClick" | "type"> {
  allowLabel?: string;
  consent: UseConsentResult;
  denyLabel?: string;
}

/**
 * Always-visible control for opt-out regions — CCPA/CPRA requires a persistent
 * "Do Not Sell or Share My Personal Information" mechanism, not just a one-time prompt.
 */
export function ConsentToggle({
  allowLabel = "Allow tracking",
  consent,
  denyLabel = "Do Not Sell or Share My Personal Information",
  ...props
}: ConsentToggleProps): ReactNode {
  return (
    <button
      data-slot="consent-toggle"
      {...props}
      // the toggle owns its click — flipping the stored decision is its whole purpose
      onClick={consent.isTrackingAllowed ? consent.deny : consent.grant}
      type="button"
    >
      {consent.isTrackingAllowed ? denyLabel : allowLabel}
    </button>
  );
}
