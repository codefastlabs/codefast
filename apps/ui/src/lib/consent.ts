import type { ConsentMode, ConsentRegion } from "@codefast/tracking/core";
import { resolveConsentMode, shouldTrackByDefault } from "@codefast/tracking/core";
import { resolveRegionFromCountryCode } from "@codefast/tracking/server";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/** Bump when the privacy policy changes — invalidates any previously stored decision. */
export const CONSENT_POLICY_VERSION = "1";

/**
 * `localStorage` key holding the visitor's `ConsentRecord` — written by `<ConsentGate />`
 * and read pre-hydration by `<GoogleTag />`'s inline bootstrap, so both must share it.
 */
export const CONSENT_STORAGE_KEY = "codefast-ui-consent";

export interface InitialConsent {
  defaultGranted: boolean;
  mode: ConsentMode;
  region: ConsentRegion;
}

declare global {
  interface Window {
    __INITIAL_CONSENT__?: InitialConsent;
  }
}

/** The safest state when there's no real visitor to resolve a region for. */
const STRICTEST_DEFAULT: InitialConsent = { defaultGranted: false, mode: "opt-in", region: "other" };

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

    const region = resolveRegionFromCountryCode(countryHeader);
    const mode = resolveConsentMode(region);
    const hasGpcSignal = getRequestHeader("sec-gpc") === "1";

    return { defaultGranted: shouldTrackByDefault(mode, hasGpcSignal), mode, region };
  })
  .client((): InitialConsent => globalThis.window.__INITIAL_CONSENT__ ?? STRICTEST_DEFAULT);
