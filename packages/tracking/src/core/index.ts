export type {
  ConsentCategory,
  ConsentDecision,
  ConsentMode,
  ConsentRecord,
  ConsentRegion,
  ConsentStorage,
  InitialConsent,
  ResolveDefaultConsentOptions,
  ResolveEffectiveConsentOptions,
} from "#/core/consent";
export {
  CONSENT_CATEGORIES,
  CONSENT_REGIONS,
  createConsentDecision,
  isConsentDecision,
  isConsentRecord,
  isConsentRegion,
  isInitialConsent,
  readStoredDecision,
  resolveConsentMode,
  resolveDefaultConsent,
  resolveEffectiveConsent,
  STRICTEST_INITIAL_CONSENT,
} from "#/core/consent";

export { decodeConsentCookieValue, encodeConsentCookieValue } from "#/core/consent-cookie";

export { readCookieValue } from "#/core/cookie";

export type { Destination, DestinationSendOptions } from "#/core/destination";

export type { EventCatalog, EventDefinition, EventPropsOf, EventsOf } from "#/core/event-catalog";
export { assertValidEventProps, defineEventCatalog } from "#/core/event-catalog";

export { deriveEventId, generateEventId } from "#/core/event-id";

export type {
  AliasEvent,
  GroupEvent,
  IdentifyEvent,
  PageViewEvent,
  TrackEvent,
  TrackedEvent,
  TrackedEventBase,
  TrackedEventSeed,
} from "#/core/tracked-event";
export { buildTrackedEvent, isTrackedEvent } from "#/core/tracked-event";
