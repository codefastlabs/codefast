/**
 * \@codefast/tracking
 *
 * Consent-gated, type-safe event tracking for TanStack Start apps: define an event
 * catalog over any Standard Schema library, wire a `ConsentConfig` + `createConsentRuntime`,
 * and fan tracked events out to gtag / Vercel Analytics destinations.
 *
 * This root is the client entry: it re-exports the isomorphic core plus the whole
 * browser-side surface (tracker, consent runtime, React bindings, client destinations).
 * Server-only lanes are their own subpaths and never belong here — `@codefast/tracking/server/*`
 * and `@codefast/tracking/adapters/*` (deny them in the client environment via
 * `SERVER_ONLY_SUBPATHS`). The Vercel destination stays on `@codefast/tracking/destinations/
 * vercel-analytics` so its `@vercel/analytics` peer is only pulled in when used.
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

// ── Client ──────────────────────────────────────────────────────────────────────────
export type { CmpConsentSignal, CmpStatus, ReconcileAdFrameworkConsentOptions } from "#/client/ad-framework-consent";
export { hasGppApi, hasTcfApi, reconcileAdFrameworkConsent } from "#/client/ad-framework-consent";

export type { ConsentRuntime, ConsentRuntimeOptions } from "#/client/consent-runtime";
export { createConsentRuntime } from "#/client/consent-runtime";

export { createLocalStorageConsentStorage } from "#/client/consent-storage";

export type { ConsentWithdrawalHandlerOptions } from "#/client/consent-withdrawal";
export { createConsentWithdrawalHandler } from "#/client/consent-withdrawal";

export type { CookieAnonymousId, CookieAnonymousIdOptions } from "#/client/cookie-anonymous-id";
export { createCookieAnonymousId } from "#/client/cookie-anonymous-id";

export type { ClientTracker, ClientTrackerOptions, DeliveryErrorContext } from "#/client/create-client-tracker";
export { createClientTracker } from "#/client/create-client-tracker";

export { hasGlobalPrivacyControlSignal } from "#/client/gpc";

export type {
  InitialConsentSnapshot,
  InitialConsentStore,
  InitialConsentStoreOptions,
} from "#/client/initial-consent-store";
export { createInitialConsentStore } from "#/client/initial-consent-store";

export type { IsAnalyticsAllowedOptions } from "#/client/is-analytics-allowed";
export { createIsAnalyticsAllowed } from "#/client/is-analytics-allowed";

export type { ServerPersistedAnonymousIdOptions } from "#/client/server-persisted-anonymous-id";
export { createServerPersistedAnonymousId } from "#/client/server-persisted-anonymous-id";

// ── React ───────────────────────────────────────────────────────────────────────────
export type {
  ConsentBannerAcceptProps,
  ConsentBannerActionsProps,
  ConsentBannerCategoryProps,
  ConsentBannerCustomizeProps,
  ConsentBannerDescriptionProps,
  ConsentBannerPreferencesProps,
  ConsentBannerProps,
  ConsentBannerRejectProps,
  ConsentBannerSaveProps,
  ConsentBannerTitleProps,
  ConsentToggleProps,
} from "#/react/consent-banner";
export {
  ConsentBanner,
  ConsentBannerAccept,
  ConsentBannerActions,
  ConsentBannerCategory,
  ConsentBannerCustomize,
  ConsentBannerDescription,
  ConsentBannerPreferences,
  ConsentBannerReject,
  ConsentBannerSave,
  ConsentBannerTitle,
  ConsentToggle,
} from "#/react/consent-banner";

export type { GtagConsentBootstrapProps } from "#/react/gtag-consent-bootstrap";
export { GtagConsentBootstrap } from "#/react/gtag-consent-bootstrap";

export type { UseConsentOptions, UseConsentResult } from "#/react/use-consent";
export { useConsent } from "#/react/use-consent";

export type { UseGoogleConsentSyncOptions } from "#/react/use-google-consent-sync";
export { useGoogleConsentSync } from "#/react/use-google-consent-sync";

export { useInitialConsent } from "#/react/use-initial-consent";

// ── Destinations (client-lane; Vercel stays on its own subpath) ───────────────────────
export type { AdConsentState } from "#/destinations/ad-consent";
export { toAdConsentState } from "#/destinations/ad-consent";

export type {
  EnsureGtagOptions,
  GoogleAnalyticsDestinationOptions,
  GtagConsentBootstrapOptions,
  GtagFunction,
  LoadGtagScriptOptions,
} from "#/destinations/google-analytics";
export {
  buildGtagConsentBootstrapScript,
  clearGoogleAnalyticsCookies,
  createGoogleAnalyticsDestination,
  ensureGtag,
  loadGtagScript,
  updateGoogleConsent,
} from "#/destinations/google-analytics";

export type { MetaDataProcessingOptions, MetaDestinationOptions, MetaEventPayload } from "#/destinations/meta";
export { createMetaDestination, toMetaDataProcessingOptions } from "#/destinations/meta";

export type {
  MicrosoftUetConsent,
  MicrosoftUetDestinationOptions,
  MicrosoftUetEventPayload,
} from "#/destinations/microsoft-uet";
export { createMicrosoftUetDestination, toMicrosoftUetConsent } from "#/destinations/microsoft-uet";

export type { TiktokConsent, TiktokDestinationOptions, TiktokEventPayload } from "#/destinations/tiktok";
export { createTiktokDestination, toTiktokConsent } from "#/destinations/tiktok";
