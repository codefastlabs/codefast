import { createServerFn } from "@tanstack/react-start";

import { initialConsentFromRequest } from "#/features/tracking/lib/initial-consent-from-request.server";

/**
 * Resolves the visitor's region-correct consent default on the per-request server lane —
 * the only place a per-visitor value is safe: page HTML is ISR/CDN-cached and shared
 * across visitors, so no render may read geo (see `visitor-consent.ts`). Own module so
 * tests can fake the network boundary without touching the store. The `.server` import is
 * static: the Start compiler strips handler bodies (and their then-unused imports) from
 * the client transform, and the default import-protection rule for `*.server.*` files
 * turns any leak into a traced build error.
 */
export const resolveVisitorConsent = createServerFn({ method: "GET" }).handler(() => initialConsentFromRequest());
