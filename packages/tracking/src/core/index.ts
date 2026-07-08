export type {
  ConsentCategory,
  ConsentDecision,
  ConsentMode,
  ConsentRecord,
  ConsentRegion,
  ConsentStorage,
} from "#/core/consent";
export {
  CONSENT_CATEGORIES,
  createConsentDecision,
  isConsentDecision,
  resolveConsentMode,
  resolveDefaultConsent,
} from "#/core/consent";

export type { Destination } from "#/core/destination";

export type { EventCatalog, EventDefinition, EventsOf } from "#/core/event-catalog";
export { defineEventCatalog } from "#/core/event-catalog";

export { generateEventId } from "#/core/event-id";

export type {
  AliasEvent,
  GroupEvent,
  IdentifyEvent,
  PageViewEvent,
  TrackEvent,
  TrackedEvent,
  TrackedEventBase,
} from "#/core/tracked-event";
