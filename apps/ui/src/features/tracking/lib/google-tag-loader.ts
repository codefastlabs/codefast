import { loadGtagScript } from "@codefast/tracking/destinations";

export const GA_MEASUREMENT_ID: string | undefined = import.meta.env.VITE_GA4_MEASUREMENT_ID;

/**
 * Idempotent gtag.js load — advanced Consent Mode already injects the tag from
 * `<GoogleTag />`'s bootstrap (even when denied). Kept as a safety net when the bootstrap
 * did not run, or after a runtime grant before the tag is present.
 */
export function loadGoogleTagScript(): void {
  if (!GA_MEASUREMENT_ID) {
    return;
  }

  loadGtagScript({ gaMeasurementId: GA_MEASUREMENT_ID });
}
