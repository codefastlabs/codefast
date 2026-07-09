import { loadGtagScript } from "@codefast/tracking/destinations";

export const GA_MEASUREMENT_ID: string | undefined = import.meta.env.VITE_GA4_MEASUREMENT_ID;

/**
 * Loads gtag.js on demand — basic Consent Mode: the tag is fetched only once analytics
 * consent is effectively granted, so a denied visitor's browser never even pings Google.
 * Page-load grants are handled by `<GoogleTag />`'s inline bootstrap; this covers a grant
 * made at runtime (banner Accept, privacy-page switch).
 */
export function loadGoogleTagScript(): void {
  if (!GA_MEASUREMENT_ID) {
    return;
  }

  loadGtagScript({ gaMeasurementId: GA_MEASUREMENT_ID });
}
