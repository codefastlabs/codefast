import { createServerFn } from "@tanstack/react-start";

import type { InitialConsent } from "#/features/tracking/lib/consent";

/**
 * Resolves the visitor's region-correct consent default on the per-request server lane —
 * the only place a per-visitor value is safe: entry pages are static files and ISR HTML
 * is CDN-cached across visitors, so no render may read geo (see `visitor-consent.ts`).
 * Own module so tests can fake the network boundary without touching the store; the
 * handler's server-only imports stay behind a dynamic import so they never reach a
 * client chunk.
 */
export const resolveVisitorConsent = createServerFn({ method: "GET" }).handler(async (): Promise<InitialConsent> => {
  const { initialConsentFromRequest } = await import("#/features/tracking/lib/initial-consent-from-request");

  return initialConsentFromRequest();
});
