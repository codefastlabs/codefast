export type { ClientTracker, ClientTrackerOptions, DeliveryErrorContext } from "#/client/create-client-tracker";
export { createClientTracker } from "#/client/create-client-tracker";

export type { ConsentRuntime, ConsentRuntimeOptions } from "#/client/consent-runtime";
export { createConsentRuntime } from "#/client/consent-runtime";

export { createLocalStorageConsentStorage } from "#/client/consent-storage";

export type { ConsentWithdrawalHandlerOptions } from "#/client/consent-withdrawal";
export { createConsentWithdrawalHandler } from "#/client/consent-withdrawal";

export type { CookieAnonymousId, CookieAnonymousIdOptions } from "#/client/cookie-anonymous-id";
export { createCookieAnonymousId } from "#/client/cookie-anonymous-id";

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
