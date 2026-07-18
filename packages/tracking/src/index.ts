/**
 * \@codefast/tracking
 *
 * Consent-gated, type-safe event tracking for TanStack Start apps: define an event
 * catalog over any Standard Schema library, wire a `ConsentConfig` + `createConsentRuntime`,
 * and fan tracked events out to gtag / Vercel Analytics destinations.
 *
 * - **Root** (this module): isomorphic catalog types, `Destination`, consent model + config — safe to import from both client and server code.
 * - **`@codefast/tracking/client`**: `createClientTracker`, `createConsentRuntime`, anonymous-id helpers.
 * - **`@codefast/tracking/server`**: region → initial-consent resolution, anonymous-id `Set-Cookie` builders. Server-only — never import from client code.
 * - **`@codefast/tracking/adapters/tanstack-start`**: request/response glue over TanStack Start's server context. Server-only — deny it in the client environment via Start's `importProtection`.
 * - **`@codefast/tracking/destinations`**: the gtag destination, script loader, and Consent Mode bootstrap; Vercel Analytics lives on its own subpath.
 */
export type {
  ConsentCategory,
  ConsentConfig,
  ConsentDecision,
  ConsentMode,
  ConsentReceipt,
  ConsentReceiptEventType,
  ConsentReceiptInput,
  ConsentReceiptMethod,
  ConsentReceiptSubjectIdType,
  ConsentRecord,
  ConsentRegion,
  ConsentStorage,
  Destination,
  EventCatalog,
  EventDefinition,
  InitialConsent,
  ResolveDefaultConsentOptions,
  ResolveEffectiveConsentOptions,
  TrackedEvent,
  TrackedEventBase,
  TrackEvent,
} from "#/core";
export {
  assertValidEventProperties,
  CONSENT_CATEGORIES,
  CONSENT_REGIONS,
  createConsentDecision,
  defineConsentConfig,
  defineEventCatalog,
  generateEventId,
  isConsentDecision,
  isConsentReceiptInput,
  isConsentRecord,
  isConsentRegion,
  isInitialConsent,
  normalizeConsentDecision,
  readCookieValue,
  readStoredDecision,
  resolveConsentMode,
  resolveDefaultConsent,
  resolveEffectiveConsent,
  STRICTEST_INITIAL_CONSENT,
} from "#/core";
