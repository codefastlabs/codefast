export type { Ga4MeasurementProtocolDestinationOptions } from "#/destinations/ga4-measurement-protocol";
export {
  createGa4MeasurementProtocolDestination,
  extractGa4ClientId,
  extractGa4SessionId,
} from "#/destinations/ga4-measurement-protocol";

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

export type { VercelAnalyticsDestinationOptions } from "#/destinations/vercel-analytics";
export { createVercelAnalyticsDestination } from "#/destinations/vercel-analytics";
