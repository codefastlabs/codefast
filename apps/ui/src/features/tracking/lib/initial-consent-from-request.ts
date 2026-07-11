import { resolveInitialConsentFromRequest } from "@codefast/tracking/tanstack-start";

import type { InitialConsent } from "#/features/tracking/lib/consent";
import { REQUESTED_CONSENT_CATEGORIES } from "#/features/tracking/lib/consent";

/**
 * Server-only module — imports the browser-poisoned `tanstack-start` subpath, so it must
 * never reach a client bundle; `resolve-visitor-consent.ts` imports it only inside its
 * handler. The package helper stamps `cache-control: private, no-store` (per-visitor by
 * definition) and fails closed on a missing geo header.
 */
export function initialConsentFromRequest(): InitialConsent {
  return resolveInitialConsentFromRequest({ requestedCategories: REQUESTED_CONSENT_CATEGORIES });
}
