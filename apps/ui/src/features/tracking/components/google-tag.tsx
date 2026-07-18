import { GtagConsentBootstrap } from "@codefast/tracking/react/gtag-consent-bootstrap";

import { consentConfig, STRICTEST_INITIAL_CONSENT } from "#/features/tracking/lib/consent";
import { GA_MEASUREMENT_ID } from "#/features/tracking/lib/google-tag-loader";

/**
 * This site's gtag Consent Mode bootstrap — the package component renders the inline
 * script in `<head>`: a stored decision wins; otherwise the baked strictest default
 * applies (the served HTML is shared across visitors, so it can carry nothing
 * region-specific). An undecided opt-out visitor's granted regional default is pushed
 * later by `<ConsentGate />` once the server-function lane resolves the region.
 */
export function GoogleTag() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <GtagConsentBootstrap
      config={consentConfig}
      defaultConsent={STRICTEST_INITIAL_CONSENT.defaultConsent}
      gaMeasurementId={GA_MEASUREMENT_ID}
    />
  );
}
