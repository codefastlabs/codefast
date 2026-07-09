import {
  createIsTrackingAllowed,
  createLocalStorageConsentStorage,
  hasGlobalPrivacyControlSignal,
} from "@codefast/tracking/client";
import type { ConsentCategory, InitialConsent } from "@codefast/tracking/core";
import { createConsentDecision } from "@codefast/tracking/core";
import { buildInitialConsent } from "@codefast/tracking/server";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

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
 * Read directly here (not a root-route `loader`) — `shellComponent` renders before the
 * root match's data functions resolve, so loader data never reaches `<GoogleTag />`.
 * This app prerenders every route, so a missing header (the common case — Nitro's
 * prerender crawler hits `localhost`) means "no real visitor", not region "other";
 * `middleware.ts` covers per-visitor personalization for the resulting static HTML, and
 * this is only its last-resort fallback.
 */
export const resolveInitialConsent = createIsomorphicFn()
  .server((): InitialConsent => {
    const countryHeader = getRequestHeader("x-vercel-ip-country");

    if (!countryHeader) {
      return STRICTEST_DEFAULT;
    }

    return buildInitialConsent({
      categories: REQUESTED_CONSENT_CATEGORIES,
      countryCode: countryHeader,
      hasGlobalPrivacyControlSignal: getRequestHeader("sec-gpc") === "1",
    });
  })
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
