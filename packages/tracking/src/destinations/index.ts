// Browser-lane barrel only. Deliberately NOT re-exported here:
// - `#/destinations/vercel-analytics` — its top-level `@vercel/analytics` import would make
//   the optional peer mandatory for every barrel consumer; import it via its own subpath.
// - `#/destinations/ga4-measurement-protocol` — carries a server `apiSecret`; its subpath
//   is server-only — deny it in client builds (e.g. Start importProtection) so the secret never ships.

export type {
  EnsureGtagOptions,
  GoogleAnalyticsDestinationOptions,
  GoogleConsentDefaultOptions,
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
  setGoogleAdsDataRedaction,
  setGoogleConsentDefault,
  setGoogleUrlPassthrough,
  updateGoogleConsent,
} from "#/destinations/google-analytics";

export type {
  GoogleTagManagerDestinationOptions,
  GtmConsentBootstrapOptions,
  LoadGtmScriptOptions,
} from "#/destinations/google-tag-manager";
export {
  buildGtmConsentBootstrapScript,
  createGoogleTagManagerDestination,
  loadGtmScript,
} from "#/destinations/google-tag-manager";

export type { HttpDestinationOptions } from "#/destinations/http";
export { createHttpDestination } from "#/destinations/http";
