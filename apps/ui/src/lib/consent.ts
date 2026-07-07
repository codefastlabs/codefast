import type { ConsentMode, ConsentRegion } from "@codefast/tracking/core";
import { resolveConsentMode, shouldTrackByDefault } from "@codefast/tracking/core";
import { resolveRegionFromCountryCode } from "@codefast/tracking/server";
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
 * On the client there's no request to read — `<GoogleTag />` embeds this same resolved
 * value into `window.__INITIAL_CONSENT__` via an inline script that runs before
 * `<ConsentGate />` hydrates, so both sides agree without a second, possibly different
 * guess.
 */
export function resolveInitialConsent(): InitialConsent {
  if (typeof globalThis.window === "undefined") {
    const region = resolveRegionFromCountryCode(getRequestHeader("x-vercel-ip-country"));
    const mode = resolveConsentMode(region);
    const hasGpcSignal = getRequestHeader("sec-gpc") === "1";

    return { defaultGranted: shouldTrackByDefault(mode, hasGpcSignal), mode, region };
  }

  return globalThis.window.__INITIAL_CONSENT__ ?? { defaultGranted: false, mode: "opt-in", region: "other" };
}
