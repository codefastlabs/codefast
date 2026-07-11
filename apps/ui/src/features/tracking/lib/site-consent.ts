import type { ConsentMode } from "@codefast/tracking";
import { readStoredDecision } from "@codefast/tracking";
import { createConsentWithdrawalHandler, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import { clearGoogleAnalyticsCookies } from "@codefast/tracking/destinations";
import type { UseConsentResult } from "@codefast/tracking/react";
import { useConsent } from "@codefast/tracking/react";
import { useEffect } from "react";

import { consentConfig } from "#/features/tracking/lib/consent";
import { clearAnonymousId, getTracker } from "#/features/tracking/lib/tracking";
import { consentRuntime, useVisitorConsent } from "#/features/tracking/lib/visitor-consent";

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
    const decision = readStoredDecision(consentRuntime.storage, consentConfig.policyVersion);

    if (decision !== undefined) {
      onConsentWithdrawal(decision);
    }
  };

  consentRuntime.storage.subscribe(syncWithdrawal);
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
  // useVisitorConsent's own effect re-kicks resolution — no separate ensure call needed.
  const { initialConsent, isResolved } = useVisitorConsent();

  // Post-hydration, once per page load — SSR keeps the baked strictest default.
  useEffect(() => {
    ensureConsentWithdrawalWatch();
  }, []);

  const consent = useConsent({
    config: consentConfig,
    hasGlobalPrivacyControlSignal: hasGlobalPrivacyControlSignal(),
    mode: initialConsent.mode,
    storage: consentRuntime.storage,
  });

  return { consent, isResolved, mode: initialConsent.mode };
}
