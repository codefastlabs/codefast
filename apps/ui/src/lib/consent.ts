import type { ConsentMode, ConsentRegion } from "@codefast/tracking/core";
import { resolveConsentMode, shouldTrackByDefault } from "@codefast/tracking/core";
import { resolveRegionFromCountryCode } from "@codefast/tracking/server";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";

/** Bump when the privacy policy changes — invalidates any previously stored decision. */
export const CONSENT_POLICY_VERSION = "1";

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
 * Region (`x-vercel-ip-country`) + GPC (`Sec-GPC` request header) resolved once per
 * document request — read directly here rather than via a root route `loader`/
 * `beforeLoad`: TanStack Start's `shellComponent` (where `<GoogleTag />`/`<ConsentGate />`
 * are mounted) renders before the root match's data functions resolve, so loader/context
 * data is never available to them (confirmed empirically — root's `loaderData`/`context`
 * stayed empty on first render, only appearing after `router.invalidate()`). Server-side
 * `getRequestHeader` works via ambient request context instead, so it's available
 * synchronously from any component's render body during SSR, with no such ordering issue.
 *
 * This app prerenders every route (static HTML, generated once at build time), so this
 * server branch mostly runs with no real visitor at all — Nitro's prerender crawler hits
 * `localhost`, which never carries `x-vercel-ip-country`. A missing header is therefore
 * treated as "no reliable signal", not silently resolved to `resolveRegionFromCountryCode`'s
 * "other" fallback (opt-out ⇒ granted) — that would bake a wrong "granted" default into
 * static HTML served to every future visitor, including real EU/VN ones. `middleware.ts`
 * covers the real per-visitor personalization for prerendered pages instead (it runs
 * per real request even for a cached static response); this value is only the last-resort
 * fallback for when that cookie is missing.
 *
 * On the client there's no request to read — `<GoogleTag />` embeds the resolved value
 * (cookie-corrected, see `middleware.ts`) into `window.__INITIAL_CONSENT__` via an inline
 * script that runs before `<ConsentGate />` hydrates, so both sides agree.
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
