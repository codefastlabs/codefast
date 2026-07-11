import type { InitialConsentSnapshot } from "@codefast/tracking/client";
import {
  createInitialConsentStore,
  createIsAnalyticsAllowed,
  hasGlobalPrivacyControlSignal,
} from "@codefast/tracking/client";
import { useInitialConsent } from "@codefast/tracking/react";

import { CONSENT_POLICY_VERSION, consentStorage, REQUESTED_CONSENT_CATEGORIES } from "#/features/tracking/lib/consent";
import { resolveVisitorConsent } from "#/features/tracking/lib/resolve-visitor-consent";

/**
 * Session cache for the resolved region default, so only the first page load of a
 * session pays the server-function round trip — disclosed on the privacy page.
 */
export const INITIAL_CONSENT_SESSION_KEY = "codefast-ui-initial-consent";

/** Hook result alias — the package store's snapshot shape. */
export type UseVisitorConsentResult = InitialConsentSnapshot;

/**
 * This site's one region-resolution store: strictest default until the server function
 * answers, per-session cache, fail-closed-but-retryable on error. Kicked off before
 * hydration by `getRouter()`; `useSiteConsent`'s effect is the idempotent safety net.
 */
export const visitorConsentStore = createInitialConsentStore({
  resolve: () => resolveVisitorConsent(),
  sessionStorageKey: INITIAL_CONSENT_SESSION_KEY,
});

/** Kicks off region resolution — single-flight and idempotent, so any surface may call it. */
export function ensureVisitorConsentResolved(): void {
  visitorConsentStore.ensureResolved();
}

/**
 * Reactive view of the visitor's resolved consent default — updates once the server lane
 * answers. The package hook also re-kicks resolution on mount, the idempotent safety net
 * behind `getRouter()`'s pre-hydration kick.
 */
export function useVisitorConsent(): UseVisitorConsentResult {
  return useInitialConsent(visitorConsentStore);
}

/** Test seam — clears the resolved state and session cache so each test resolves fresh. */
export function resetVisitorConsentForTests(): void {
  visitorConsentStore.reset();
}

/** Non-React gate for `createClientTracker({ isAnalyticsAllowed })`. */
export const isAnalyticsAllowed = createIsAnalyticsAllowed({
  getMode: () => visitorConsentStore.getSnapshot().initialConsent.mode,
  hasGlobalPrivacyControlSignal,
  policyVersion: CONSENT_POLICY_VERSION,
  requestedCategories: REQUESTED_CONSENT_CATEGORIES,
  storage: consentStorage,
});
