export type { ServerTrackContext, ServerTracker, ServerTrackerOptions } from "#/server/create-server-tracker";
export { createServerTracker } from "#/server/create-server-tracker";

export type { BuildInitialConsentOptions, InitialConsent } from "#/server/initial-consent";
export { buildInitialConsent } from "#/server/initial-consent";

export {
  EU_COUNTRY_CODES,
  OPT_IN_EQUIVALENT_COUNTRY_CODES,
  resolveRegion,
  resolveRegionFromCountryCode,
} from "#/server/region";
