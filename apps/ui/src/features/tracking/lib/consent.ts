import { createLocalStorageConsentStorage } from "@codefast/tracking/client";
import type { ConsentCategory, InitialConsent } from "@codefast/tracking/core";
import { createConsentDecision } from "@codefast/tracking/core";

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

/**
 * What every render bakes and every visitor starts from — deliberately visitor-independent,
 * since entry pages are static files and ISR HTML is CDN-cached across visitors; a
 * request-derived value here would leak the first visitor's region to everyone behind the
 * cache. The region-correct default arrives per visitor over the server-function lane
 * (`resolve-visitor-consent.ts`) after hydration.
 */
export const STRICTEST_INITIAL_CONSENT: InitialConsent = {
  defaultConsent: createConsentDecision([]),
  mode: "opt-in",
  region: "other",
};

// Module scope — every consumer must share one storage so decisions sync across surfaces.
export const consentStorage = createLocalStorageConsentStorage(CONSENT_STORAGE_KEY);
