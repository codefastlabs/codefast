import type { ReactNode } from "react";

import type { UseConsentResult } from "#/react/use-consent";

export interface ConsentBannerProps {
  acceptLabel?: string;
  className?: string;
  consent: UseConsentResult;
  message?: string;
  rejectLabel?: string;
}

/**
 * Blocking opt-in prompt for GDPR/NĐ 13 regions — renders nothing once a decision
 * exists or the region defaults to opt-out (`consent.needsPrompt` covers both). No
 * styling is baked in; pass `className` to match the host app's design system.
 */
export function ConsentBanner({
  acceptLabel = "Accept",
  className,
  consent,
  message = "We use cookies to understand how you use this site.",
  rejectLabel = "Reject",
}: ConsentBannerProps): ReactNode {
  if (!consent.needsPrompt) {
    return null;
  }

  return (
    <dialog aria-live="polite" className={className} open>
      <p>{message}</p>
      <button onClick={consent.grant} type="button">
        {acceptLabel}
      </button>
      <button onClick={consent.deny} type="button">
        {rejectLabel}
      </button>
    </dialog>
  );
}

export interface ConsentToggleProps {
  allowLabel?: string;
  className?: string;
  consent: UseConsentResult;
  denyLabel?: string;
}

/**
 * Always-visible control for opt-out regions — CCPA/CPRA requires a persistent
 * "Do Not Sell or Share My Personal Information" mechanism, not just a one-time prompt.
 */
export function ConsentToggle({
  allowLabel = "Allow tracking",
  className,
  consent,
  denyLabel = "Do Not Sell or Share My Personal Information",
}: ConsentToggleProps): ReactNode {
  return (
    <button className={className} onClick={consent.isTrackingAllowed ? consent.deny : consent.grant} type="button">
      {consent.isTrackingAllowed ? denyLabel : allowLabel}
    </button>
  );
}
