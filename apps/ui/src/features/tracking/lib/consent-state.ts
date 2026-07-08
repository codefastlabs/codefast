import { createLocalStorageConsentStorage, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import { resolveEffectiveConsent } from "@codefast/tracking/core";

import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  REQUESTED_CONSENT_CATEGORIES,
  resolveInitialConsent,
} from "#/features/tracking/lib/consent";

// Module scope — every consumer must share one storage so decisions sync across surfaces.
export const consentStorage = createLocalStorageConsentStorage(CONSENT_STORAGE_KEY);

/**
 * Non-React mirror of `useConsent`'s effective-consent rule — gates the tracker pipeline
 * outside components.
 */
export function isTrackingAllowed(): boolean {
  const effectiveConsent = resolveEffectiveConsent(
    consentStorage,
    CONSENT_POLICY_VERSION,
    REQUESTED_CONSENT_CATEGORIES,
    resolveInitialConsent().mode,
    hasGlobalPrivacyControlSignal(),
  );

  return effectiveConsent.analytics;
}
