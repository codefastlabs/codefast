import { resolveInitialConsentFromRequest } from "@codefast/tracking/tanstack-start";

import type { InitialConsent } from "#/features/tracking/lib/consent";
import { REQUESTED_CONSENT_CATEGORIES } from "#/features/tracking/lib/consent";

/**
 * Server-only module — the `.server` suffix makes any client-graph leak a traced
 * import-protection build error, and vite.config denies the `tanstack-start` subpath in
 * the client environment as well. The package helper stamps
 * `cache-control: private, no-store` (per-visitor by definition) and fails closed on a
 * missing geo header.
 */
export function initialConsentFromRequest(): InitialConsent {
  return resolveInitialConsentFromRequest({ requestedCategories: REQUESTED_CONSENT_CATEGORIES });
}
