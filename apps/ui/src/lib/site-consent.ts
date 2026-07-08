import { createLocalStorageConsentStorage, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import type { ConsentMode } from "@codefast/tracking/core";
import type { UseConsentResult } from "@codefast/tracking/react";
import { useConsent } from "@codefast/tracking/react";

import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  REQUESTED_CONSENT_CATEGORIES,
  resolveInitialConsent,
} from "#/lib/consent";
import { getTracker } from "#/lib/tracking";

// Module scope — every consumer must share one storage so decisions sync across surfaces.
const consentStorage = createLocalStorageConsentStorage(CONSENT_STORAGE_KEY);

export interface UseSiteConsentResult {
  consent: UseConsentResult;
  mode: ConsentMode;
}

/**
 * This site's one consent wiring, shared by the footer `<ConsentGate />` and the privacy
 * page's `<PrivacyChoices />` — both hook instances read the same storage, so a decision
 * made on either surface updates the other immediately. The gtag "consent update" effect
 * stays in `<ConsentGate />` alone (it renders on every page), so a decision never emits
 * a duplicate update.
 */
export function useSiteConsent(): UseSiteConsentResult {
  const { mode } = resolveInitialConsent();

  const consent = useConsent({
    categories: REQUESTED_CONSENT_CATEGORIES,
    hasGlobalPrivacyControlSignal: hasGlobalPrivacyControlSignal(),
    mode,
    onDecision(decision) {
      if (!decision.analytics) {
        getTracker().clear();
      }
    },
    policyVersion: CONSENT_POLICY_VERSION,
    storage: consentStorage,
  });

  return { consent, mode };
}
