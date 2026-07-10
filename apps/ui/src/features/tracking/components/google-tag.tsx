import { buildGtagConsentBootstrapScript } from "@codefast/tracking/destinations";

import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  STRICTEST_INITIAL_CONSENT,
} from "#/features/tracking/lib/consent";
import { GA_MEASUREMENT_ID } from "#/features/tracking/lib/google-tag-loader";

/**
 * This site's gtag Consent Mode bootstrap — a stored decision wins; otherwise the baked
 * strictest default applies (the served HTML is shared across visitors, so it can carry
 * nothing region-specific). An undecided opt-out visitor's granted regional default is
 * pushed later by `<ConsentGate />` once the server-function lane resolves the region.
 */
export function buildGtagBootstrapScript(gaMeasurementId: string): string {
  return buildGtagConsentBootstrapScript({
    consentStorageKey: CONSENT_STORAGE_KEY,
    defaultConsent: STRICTEST_INITIAL_CONSENT.defaultConsent,
    gaMeasurementId,
    policyVersion: CONSENT_POLICY_VERSION,
  });
}

/**
 * Advanced Consent Mode bootstrap: consent default first, then always load gtag.js.
 * Renders from the builder above, so the unit tests exercise the exact inlined source.
 */
export function GoogleTag() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <script
      dangerouslySetInnerHTML={{ __html: buildGtagBootstrapScript(GA_MEASUREMENT_ID) }}
      suppressHydrationWarning
    />
  );
}
