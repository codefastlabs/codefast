import type { ConsentDecision, ConsentMode } from "@codefast/tracking";
import { readCookieValue, readStoredDecision } from "@codefast/tracking";
import { createConsentWithdrawalHandler } from "@codefast/tracking/client/consent-withdrawal";
import { hasGlobalPrivacyControlSignal } from "@codefast/tracking/client/gpc";
import { clearGoogleAnalyticsCookies } from "@codefast/tracking/destinations/google-analytics";
import type { UseConsentResult } from "@codefast/tracking/react/use-consent";
import { useConsent } from "@codefast/tracking/react/use-consent";
import { useEffect } from "react";

import { ANONYMOUS_ID_COOKIE_NAME } from "#/features/tracking/lib/anonymous-id";
import { consentConfig } from "#/features/tracking/lib/consent";
import { recordConsentReceipt } from "#/features/tracking/lib/consent-receipt";
import { clearAnonymousId } from "#/features/tracking/lib/tracking";
import { consentRuntime, useVisitorConsent } from "#/features/tracking/lib/visitor-consent";

/**
 * Records a server-side consent receipt for a decision made on this surface. Fired from
 * `useConsent({ onDecision })`, so cross-tab syncs (which arrive via the storage
 * subscription, not `onDecision`) never double-record. A receipt write must never break
 * the decision UX, so failures are swallowed.
 */
function recordDecisionReceipt(decision: ConsentDecision): void {
  const existingId =
    typeof document === "undefined" ? undefined : readCookieValue(document.cookie, ANONYMOUS_ID_COOKIE_NAME);

  void recordConsentReceipt({
    data: {
      decision,
      eventType: decision.ads || decision.analytics ? "give" : "withdraw",
      method: "granular",
      noticeLanguage: typeof navigator === "undefined" ? "en" : navigator.language,
      noticeVersion: consentConfig.policyVersion,
      policyVersion: consentConfig.policyVersion,
      subjectId: existingId ?? crypto.randomUUID(),
      subjectIdType: "cookie",
    },
  }).catch(() => {
    /* a receipt write must never break the decision UX */
  });
}

export interface UseSiteConsentResult {
  consent: UseConsentResult;
  /** False until the visitor's region default resolves — gate region-dependent UI on it. */
  isResolved: boolean;
  mode: ConsentMode;
}

const onConsentWithdrawal = createConsentWithdrawalHandler({
  clearAnonymousId,
  clearGoogleAnalyticsCookies,
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
    onDecision: recordDecisionReceipt,
    storage: consentRuntime.storage,
  });

  return { consent, isResolved, mode: initialConsent.mode };
}
