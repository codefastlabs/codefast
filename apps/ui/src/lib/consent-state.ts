import { createLocalStorageConsentStorage, hasGlobalPrivacyControlSignal } from "@codefast/tracking/client";
import { isConsentDecision, resolveDefaultConsent } from "@codefast/tracking/core";

import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  REQUESTED_CONSENT_CATEGORIES,
  resolveInitialConsent,
} from "#/lib/consent";

// Module scope — every consumer must share one storage so decisions sync across surfaces.
export const consentStorage = createLocalStorageConsentStorage(CONSENT_STORAGE_KEY);

/**
 * Non-React mirror of `useConsent`'s effective-consent rule — gates the tracker pipeline
 * outside components: the stored decision under the current policy version wins, else
 * the region default applies.
 */
export function isTrackingAllowed(): boolean {
  const record = consentStorage.load();
  const decision =
    record?.policyVersion === CONSENT_POLICY_VERSION && isConsentDecision(record.decision)
      ? record.decision
      : undefined;
  const effectiveConsent =
    decision ??
    resolveDefaultConsent(resolveInitialConsent().mode, REQUESTED_CONSENT_CATEGORIES, hasGlobalPrivacyControlSignal());

  return effectiveConsent.analytics;
}
