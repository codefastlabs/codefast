import type { ConsentCategory, InitialConsent } from "@codefast/tracking";
import { STRICTEST_INITIAL_CONSENT } from "@codefast/tracking";
import { createLocalStorageConsentStorage } from "@codefast/tracking/client";

/** Bump when the privacy policy changes — invalidates any previously stored decision. */
export const CONSENT_POLICY_VERSION = "1";

/**
 * `localStorage` key holding the visitor's `ConsentRecord` — written by `<ConsentGate />`
 * and read pre-hydration by `<GoogleTag />`'s inline bootstrap, so both must share it.
 */
export const CONSENT_STORAGE_KEY = "codefast-ui-consent";

/** The only purpose this site tracks for — it runs no ads, so `ads` is never requested. */
export const REQUESTED_CONSENT_CATEGORIES: ReadonlyArray<ConsentCategory> = ["analytics"];

export type { InitialConsent };
// Every render bakes this visitor-independent default — ISR HTML is CDN-cached and shared
// across visitors, so nothing per-request may enter it; the region-correct value arrives
// per visitor over the server-function lane (`resolve-visitor-consent.ts`).
export { STRICTEST_INITIAL_CONSENT };

// Module scope — every consumer must share one storage so decisions sync across surfaces.
export const consentStorage = createLocalStorageConsentStorage(CONSENT_STORAGE_KEY);
