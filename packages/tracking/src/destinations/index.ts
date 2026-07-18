// Browser-lane barrel. Deliberately NOT re-exported here:
// - `#/destinations/vercel-analytics` — its top-level `@vercel/analytics` import would make
//   the optional peer mandatory for every barrel consumer; import it via its own subpath.

export type { AdConsentState } from "#/destinations/ad-consent";
export { toAdConsentState } from "#/destinations/ad-consent";
export type { MetaDataProcessingOptions, MetaDestinationOptions, MetaEventPayload } from "#/destinations/meta";
export { createMetaDestination, toMetaDataProcessingOptions } from "#/destinations/meta";
export type {
  EnsureGtagOptions,
  GoogleAnalyticsDestinationOptions,
  GtagConsentBootstrapOptions,
  GtagFunction,
  LoadGtagScriptOptions,
} from "#/destinations/google-analytics";
export {
  buildGtagConsentBootstrapScript,
  clearGoogleAnalyticsCookies,
  createGoogleAnalyticsDestination,
  ensureGtag,
  loadGtagScript,
  updateGoogleConsent,
} from "#/destinations/google-analytics";
