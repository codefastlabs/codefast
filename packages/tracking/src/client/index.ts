export type { ClientTracker, ClientTrackerOptions } from "#/client/create-client-tracker";
export { createClientTracker } from "#/client/create-client-tracker";

export { createLocalStorageConsentStorage } from "#/client/consent-storage";

export type { CreateConsentWithdrawalHandlerOptions } from "#/client/consent-withdrawal";
export { createConsentWithdrawalHandler } from "#/client/consent-withdrawal";

export type { CookieAnonymousId, CookieAnonymousIdOptions } from "#/client/cookie-anonymous-id";
export { createCookieAnonymousId } from "#/client/cookie-anonymous-id";

export { hasGlobalPrivacyControlSignal } from "#/client/gpc";

export type { CreateIsTrackingAllowedOptions } from "#/client/is-tracking-allowed";
export { createIsTrackingAllowed } from "#/client/is-tracking-allowed";

export type { ClientLifecycleOptions } from "#/client/lifecycle";
export { attachClientLifecycle } from "#/client/lifecycle";

export { createLocalStorageQueueStorage } from "#/client/local-storage";

export type { EventQueueOptions, EventQueueStorage } from "#/client/queue";
export { EventQueue } from "#/client/queue";

export type { RouterLike } from "#/client/router";
export { attachRouterPageTracking } from "#/client/router";

export type { ServerPersistedAnonymousIdOptions } from "#/client/server-persisted-anonymous-id";
export { createServerPersistedAnonymousId } from "#/client/server-persisted-anonymous-id";
