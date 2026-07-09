export type { Ga4MeasurementProtocolDestinationOptions } from "#/destinations/ga4-measurement-protocol";
export {
  createGa4MeasurementProtocolDestination,
  extractGa4ClientId,
  extractGa4SessionId,
} from "#/destinations/ga4-measurement-protocol";

export type {
  GoogleAnalyticsDestinationOptions,
  GoogleConsentDefaultOptions,
  GtagConsentBootstrapOptions,
  GtagFunction,
  LoadGtagScriptOptions,
} from "#/destinations/google-analytics";
export {
  buildGtagConsentBootstrapScript,
  createGoogleAnalyticsDestination,
  ensureGtag,
  loadGtagScript,
  setGoogleAdsDataRedaction,
  setGoogleConsentDefault,
  setGoogleUrlPassthrough,
  updateGoogleConsent,
} from "#/destinations/google-analytics";

export type { HttpDestinationOptions } from "#/destinations/http-destination";
export { createHttpDestination } from "#/destinations/http-destination";

export { createVercelAnalyticsDestination } from "#/destinations/vercel-analytics";
