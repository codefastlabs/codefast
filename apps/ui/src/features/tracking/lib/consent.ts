import type { InitialConsent } from "@codefast/tracking";
import { defineConsentConfig, STRICTEST_INITIAL_CONSENT } from "@codefast/tracking";

/**
 * The one consent contract every surface shares — the banner hook, the tracker gate,
 * `<GoogleTag />`'s pre-hydration bootstrap, and the server lane all read this object,
 * so keys, policy version, and requested purposes can never drift between them.
 * Bump `policyVersion` when the privacy policy changes — it invalidates any previously
 * stored decision. This site runs no ads, so `ads` is never requested.
 */
export const consentConfig = defineConsentConfig({
  policyVersion: "1",
  requestedCategories: ["analytics"],
  storageKey: "codefast-ui-consent",
});

export type { InitialConsent };
// Every render bakes this visitor-independent default — ISR HTML is CDN-cached and shared
// across visitors, so nothing per-request may enter it; the region-correct value arrives
// per visitor over the server-function lane (`resolve-visitor-consent.ts`).
export { STRICTEST_INITIAL_CONSENT };
