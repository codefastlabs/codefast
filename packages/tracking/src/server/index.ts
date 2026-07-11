export type { AnonymousIdSetCookieOptions } from "#/server/anonymous-id-cookie";
export {
  buildAnonymousIdSetCookie,
  buildClearAnonymousIdSetCookie,
  isValidAnonymousId,
  readAnonymousIdCookie,
} from "#/server/anonymous-id-cookie";

export { readConsentDecisionCookie, readConsentRecordCookie } from "#/server/consent-cookie";

export type {
  BoundServerTracker,
  ServerTracker,
  ServerTrackerContext,
  ServerTrackerOptions,
} from "#/server/create-server-tracker";
export { createServerTracker } from "#/server/create-server-tracker";

export type { InitialConsent, InitialConsentOptions } from "#/server/initial-consent";
export { resolveInitialConsent } from "#/server/initial-consent";

export type {
  RelayContext,
  RelayResult,
  RelayTrackedEventsOptions,
  TrackedEventIngestHandlerOptions,
} from "#/server/relay";
export { createTrackedEventIngestHandler, relayTrackedEvents } from "#/server/relay";

export {
  EU_COUNTRY_CODES,
  OPT_IN_EQUIVALENT_COUNTRY_CODES,
  resolveRegion,
  resolveRegionFromCountryCode,
} from "#/server/region";
