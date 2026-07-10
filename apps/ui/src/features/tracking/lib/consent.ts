import {
  createIsTrackingAllowed,
  createLocalStorageConsentStorage,
  hasGlobalPrivacyControlSignal,
} from "@codefast/tracking/client";
import type { ConsentCategory, InitialConsent } from "@codefast/tracking/core";
import { createConsentDecision } from "@codefast/tracking/core";
import { createIsomorphicFn } from "@tanstack/react-start";

/** Bump when the privacy policy changes — invalidates any previously stored decision. */
export const CONSENT_POLICY_VERSION = "1";

/**
 * `localStorage` key holding the visitor's `ConsentRecord` — written by `<ConsentGate />`
 * and read pre-hydration by `<GoogleTag />`'s inline bootstrap, so both must share it.
 */
export const CONSENT_STORAGE_KEY = "codefast-ui-consent";

/**
 * Read by `google-tag.tsx`'s bootstrap. The writer, `middleware.ts`, duplicates this
 * literal (Vercel compiles it independently of the app build, so it imports nothing
 * from `src/`) — `middleware.test.ts` guards the sync.
 */
export const INITIAL_CONSENT_COOKIE_NAME = "codefast-ui-initial-consent";

/** The only purpose this site tracks for — it runs no ads, so `ads` is never requested. */
export const REQUESTED_CONSENT_CATEGORIES: ReadonlyArray<ConsentCategory> = ["analytics"];

export type { InitialConsent };

declare global {
  interface Window {
    __INITIAL_CONSENT__?: InitialConsent;
  }
}

/** The safest state when there's no real visitor to resolve a region for. */
const STRICTEST_DEFAULT: InitialConsent = {
  defaultConsent: createConsentDecision([]),
  mode: "opt-in",
  region: "other",
};

/**
 * Deliberately visitor-independent on the server: every server render is CDN-cached (ISR)
 * and shared across visitors, so any request-derived value baked here (geo, GPC) would
 * leak the first visitor's region to everyone served from that cache entry. The strictest
 * default is the only safe baked value; `middleware.ts`'s cookie personalizes per visitor
 * outside the cache, and the client reads it via `window.__INITIAL_CONSENT__`.
 */
export const resolveInitialConsent = createIsomorphicFn()
  .server((): InitialConsent => STRICTEST_DEFAULT)
  .client((): InitialConsent => globalThis.window.__INITIAL_CONSENT__ ?? STRICTEST_DEFAULT);

// Module scope — every consumer must share one storage so decisions sync across surfaces.
export const consentStorage = createLocalStorageConsentStorage(CONSENT_STORAGE_KEY);

/** Non-React gate for `createClientTracker({ isTrackingAllowed })`. */
export const isTrackingAllowed = createIsTrackingAllowed({
  categories: REQUESTED_CONSENT_CATEGORIES,
  getMode: () => resolveInitialConsent().mode,
  hasGlobalPrivacyControlSignal,
  policyVersion: CONSENT_POLICY_VERSION,
  storage: consentStorage,
});
