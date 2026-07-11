import { buildInitialConsent } from "@codefast/tracking/server";
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";

import type { InitialConsent } from "#/features/tracking/lib/consent";
import { REQUESTED_CONSENT_CATEGORIES } from "#/features/tracking/lib/consent";

/**
 * Server-only module — imports from `@tanstack/react-start/server`, so it must never
 * reach a client bundle; `resolve-visitor-consent.ts` imports it only inside its handler.
 * A missing geo header (a host without geo) fails closed inside `buildInitialConsent`.
 */
export function initialConsentFromRequest(): InitialConsent {
  // Per-visitor by definition — no shared cache may ever store it.
  setResponseHeader("cache-control", "private, no-store");

  return buildInitialConsent({
    countryCode: getRequestHeader("x-vercel-ip-country"),
    hasGlobalPrivacyControlSignal: getRequestHeader("sec-gpc") === "1",
    requestedCategories: REQUESTED_CONSENT_CATEGORIES,
  });
}
