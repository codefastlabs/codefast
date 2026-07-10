import { buildInitialConsent } from "@codefast/tracking/server";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

import type { InitialConsent } from "#/features/tracking/lib/consent";
import { REQUESTED_CONSENT_CATEGORIES, STRICTEST_INITIAL_CONSENT } from "#/features/tracking/lib/consent";

/**
 * Server-only module — imports from `@tanstack/react-start/server`, so it must never
 * reach a client bundle; `resolve-visitor-consent.ts` imports it only inside its handler.
 */
export function initialConsentFromRequest(): InitialConsent {
  // Per-visitor by definition — no shared cache may ever store it.
  setResponseHeader("cache-control", "private, no-store");

  const countryCode = getRequestHeader("x-vercel-ip-country");

  // No geo header means an unknown visitor (a host without geo, not a known non-EU
  // country) — `buildInitialConsent` would map it to opt-out; fail closed instead.
  if (!countryCode) {
    return STRICTEST_INITIAL_CONSENT;
  }

  return buildInitialConsent({
    categories: REQUESTED_CONSENT_CATEGORIES,
    countryCode,
    hasGlobalPrivacyControlSignal: getRequestHeader("sec-gpc") === "1",
  });
}
