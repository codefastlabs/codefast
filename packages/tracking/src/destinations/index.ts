export type { Ga4MeasurementProtocolDestinationOptions } from "#/destinations/ga4-measurement-protocol";
export {
  createGa4MeasurementProtocolDestination,
  extractGa4ClientId,
  extractGa4SessionId,
} from "#/destinations/ga4-measurement-protocol";

export type { GoogleAnalyticsDestinationOptions, GoogleConsentOptions } from "#/destinations/google-analytics";
export {
  createGoogleAnalyticsDestination,
  setGoogleConsentDefault,
  updateGoogleConsent,
} from "#/destinations/google-analytics";

export type { HttpDestinationOptions } from "#/destinations/http-destination";
export { createHttpDestination } from "#/destinations/http-destination";

export { createVercelAnalyticsDestination } from "#/destinations/vercel-analytics";
