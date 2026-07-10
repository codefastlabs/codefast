export type {
  ConsentCategory,
  ConsentDecision,
  ConsentMode,
  ConsentRecord,
  ConsentRegion,
  ConsentStorage,
  InitialConsent,
} from "#/core/consent";
export {
  CONSENT_CATEGORIES,
  createConsentDecision,
  isConsentDecision,
  isConsentRecord,
  readStoredDecision,
  resolveConsentMode,
  resolveDefaultConsent,
  resolveEffectiveConsent,
} from "#/core/consent";

export { readCookieValue } from "#/core/cookie";

export type { Destination } from "#/core/destination";

export type { EventCatalog, EventDefinition, EventsOf } from "#/core/event-catalog";
export { defineEventCatalog } from "#/core/event-catalog";

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
export { assertNever, buildTrackedEvent, isTrackedEvent } from "#/core/tracked-event";
