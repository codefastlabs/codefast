/**
 * \@codefast/tracking
 *
 * Consent-gated, type-safe event tracking for TanStack Start apps: define an event
 * catalog over any Standard Schema library, wire a `ConsentConfig` + `createConsentRuntime`,
 * and fan tracked events out to gtag / Vercel Analytics destinations.
 *
 * This root is the **isomorphic core** entry — the consent/event primitives that run on
 * either side. The browser surface (tracker, consent runtime, React bindings, client
 * destinations) and the server lanes each live at their own subpath, imported directly
 * (`@codefast/tracking/client/*`, `/react/*`, `/destinations/*`, `/server/*`,
 * `/adapters/*`) — so a consumer pulls exactly one lane, React types never couple into
 * this entry, and the server-only lanes stay deniable in the client environment via
 * `SERVER_ONLY_SUBPATHS`.
 */

// ── Core (isomorphic) ───────────────────────────────────────────────────────────────
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

export type {
  ConsentReceipt,
  ConsentReceiptEventType,
  ConsentReceiptInput,
  ConsentReceiptMethod,
  ConsentReceiptSubjectIdType,
} from "#/core/consent-receipt";
export { isConsentReceiptInput } from "#/core/consent-receipt";

export { readCookieValue } from "#/core/cookie";

export type { Destination } from "#/core/destination";

export type { EventCatalog, EventDefinition } from "#/core/event-catalog";
export { assertValidEventProperties, defineEventCatalog } from "#/core/event-catalog";

export { generateEventId } from "#/core/event-id";

export type { TrackedEvent, TrackedEventBase, TrackEvent } from "#/core/tracked-event";
