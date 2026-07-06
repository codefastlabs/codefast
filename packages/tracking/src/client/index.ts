export type { ClientTracker, ClientTrackerOptions } from "#/client/create-client-tracker";
export { createClientTracker } from "#/client/create-client-tracker";

export { createLocalStorageConsentStorage } from "#/client/consent-storage";

export { hasGlobalPrivacyControlSignal } from "#/client/gpc";

export type { ClientLifecycleOptions } from "#/client/lifecycle";
export { attachClientLifecycle } from "#/client/lifecycle";

export { createLocalStorageQueueStorage } from "#/client/local-storage";

export type { EventQueueOptions, EventQueueStorage } from "#/client/queue";
export { EventQueue } from "#/client/queue";

export type { RouterLike } from "#/client/router";
export { attachRouterPageTracking } from "#/client/router";
