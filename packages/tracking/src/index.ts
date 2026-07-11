/**
 * \@codefast/tracking
 *
 * Fullstack, type-safe event tracking: apps define an event catalog over any Standard
 * Schema library (zod, zod/mini, valibot, ...) tagged with an owner ("client" | "server"),
 * then build trackers from it that only allow firing events owned by that side — enforced
 * at compile time, not by convention.
 *
 * - **Root** (this module): isomorphic catalog types, `Destination`, consent helpers — safe to import from both client and server code.
 * - **`@codefast/tracking/client`**: `createClientTracker` — batching, offline queue, retry — plus the initial-consent store and consent-cookie mirror.
 * - **`@codefast/tracking/server`**: `createServerTracker`, the beacon relay/ingest lane, region detection and consent-cookie reading. Server-only — never import from client code.
 * - **`@codefast/tracking/tanstack-start`**: request/response glue over TanStack Start's server context. Server-only — deny it in the client environment via Start's `importProtection`.
 * - **`@codefast/tracking/destinations`**: browser destinations (gtag, GTM, HTTP), script loaders, and the Consent Mode bootstrap builders.
 */
export type {
  AliasEvent,
  ConsentCategory,
  ConsentDecision,
  ConsentMode,
  ConsentRecord,
  ConsentRegion,
  ConsentStorage,
  Destination,
  DestinationSendOptions,
  EventCatalog,
  EventDefinition,
  EventPropsOf,
  EventsOf,
  GroupEvent,
  IdentifyEvent,
  InitialConsent,
  PageViewEvent,
  ResolveDefaultConsentOptions,
  ResolveEffectiveConsentOptions,
  TrackEvent,
  TrackedEvent,
  TrackedEventBase,
  TrackedEventSeed,
} from "#/core";
export {
  assertValidEventProps,
  buildTrackedEvent,
  CONSENT_CATEGORIES,
  CONSENT_REGIONS,
  createConsentDecision,
  decodeConsentCookieValue,
  defineEventCatalog,
  deriveEventId,
  encodeConsentCookieValue,
  generateEventId,
  isConsentDecision,
  isConsentRecord,
  isConsentRegion,
  isInitialConsent,
  isTrackedEvent,
  readCookieValue,
  readStoredDecision,
  resolveConsentMode,
  resolveDefaultConsent,
  resolveEffectiveConsent,
  STRICTEST_INITIAL_CONSENT,
} from "#/core";
