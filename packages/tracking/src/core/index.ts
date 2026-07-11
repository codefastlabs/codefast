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
  normalizeConsentDecision,
  readStoredDecision,
  resolveConsentMode,
  resolveDefaultConsent,
  resolveEffectiveConsent,
  STRICTEST_INITIAL_CONSENT,
} from "#/core/consent";

export type { ConsentConfig } from "#/core/consent-config";
export { defineConsentConfig } from "#/core/consent-config";

export { readCookieValue } from "#/core/cookie";

export type { Destination } from "#/core/destination";

export type { EventCatalog, EventDefinition } from "#/core/event-catalog";
export { assertValidEventProperties, defineEventCatalog } from "#/core/event-catalog";

export { generateEventId } from "#/core/event-id";

export type { TrackedEvent, TrackedEventBase, TrackEvent } from "#/core/tracked-event";
