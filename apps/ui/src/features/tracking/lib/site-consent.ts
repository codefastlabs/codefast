import { createConsentWithdrawalHandler, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import type { ConsentMode } from "@codefast/tracking/core";
import { readStoredDecision } from "@codefast/tracking/core";
import { clearGoogleAnalyticsCookies } from "@codefast/tracking/destinations";
import type { UseConsentResult } from "@codefast/tracking/react";
import { useConsent } from "@codefast/tracking/react";
import { useEffect } from "react";

import { CONSENT_POLICY_VERSION, consentStorage, REQUESTED_CONSENT_CATEGORIES } from "#/features/tracking/lib/consent";
import { clearAnonymousId, getTracker } from "#/features/tracking/lib/tracking";
import { ensureVisitorConsentResolved, useVisitorConsent } from "#/features/tracking/lib/visitor-consent";

export interface UseSiteConsentResult {
  consent: UseConsentResult;
  /** False until the visitor's region default resolves — gate region-dependent UI on it. */
  isResolved: boolean;
  mode: ConsentMode;
}

const onConsentWithdrawal = createConsentWithdrawalHandler({
  clearAnonymousId,
  clearGoogleAnalyticsCookies,
  clearTracker: () => {
    getTracker().clear();
  },
});

let isWithdrawalWatchStarted = false;

/**
 * One storage subscriber for the whole app — `<ConsentGate />` and `<PrivacyChoices />`
 * both call `useSiteConsent`, and per-instance effects would double `clearOnServer`.
 */
function ensureConsentWithdrawalWatch(): void {
  if (isWithdrawalWatchStarted) {
    return;
  }

  isWithdrawalWatchStarted = true;

  const syncWithdrawal = (): void => {
    const decision = readStoredDecision(consentStorage, CONSENT_POLICY_VERSION);

    if (decision !== undefined) {
      onConsentWithdrawal(decision);
    }
  };

  consentStorage.subscribe(syncWithdrawal);
  syncWithdrawal();
}

/**
 * This site's one consent wiring, shared by the footer `<ConsentGate />` and the privacy
 * page's `<PrivacyChoices />` — both hook instances read the same storage, so a decision
 * made on either surface updates the other immediately. The gtag "consent update" effect
 * stays in `<ConsentGate />` alone (it renders on every page), so a decision never emits
 * a duplicate update.
 *
 * Only `initialConsent.mode` is consumed here: `effectiveConsent` is recomputed client-side
 * (live navigator GPC) and `<ConsentGate />` pushes that into gtag. Server `defaultConsent`
 * is unused on this analytics-only site — GPC only forces `ads` denied.
 */
export function useSiteConsent(): UseSiteConsentResult {
  const { initialConsent, isResolved } = useVisitorConsent();

  // Post-hydration, once per page load — SSR keeps the baked strictest default.
  useEffect(() => {
    ensureVisitorConsentResolved();
    ensureConsentWithdrawalWatch();
  }, []);

  const consent = useConsent({
    categories: REQUESTED_CONSENT_CATEGORIES,
    hasGlobalPrivacyControlSignal: hasGlobalPrivacyControlSignal(),
    mode: initialConsent.mode,
    policyVersion: CONSENT_POLICY_VERSION,
    storage: consentStorage,
  });

  return { consent, isResolved, mode: initialConsent.mode };
}
