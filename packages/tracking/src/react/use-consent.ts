import { useCallback, useState } from "react";

import type { ConsentDecision, ConsentMode, ConsentStorage } from "#/core/consent";
import { shouldTrackByDefault } from "#/core/consent";

export interface UseConsentOptions {
  hasGlobalPrivacyControlSignal?: boolean;
  mode: ConsentMode;
  onDecision?: (decision: ConsentDecision) => void;
  policyVersion: string;
  storage: ConsentStorage;
}

export interface UseConsentResult {
  deny: () => void;
  grant: () => void;
  isTrackingAllowed: boolean;
  /** True only for opt-in regions with no stored decision yet — drives whether to render the banner. */
  needsPrompt: boolean;
}

/**
 * Bridges `resolveConsentMode`/`shouldTrackByDefault` (core, region-aware) to React state,
 * persisting the visitor's decision via the given `ConsentStorage`.
 */
export function useConsent(options: UseConsentOptions): UseConsentResult {
  const [decision, setDecision] = useState<ConsentDecision | undefined>(() => options.storage.load()?.decision);

  const decide = useCallback(
    (next: ConsentDecision): void => {
      options.storage.save({ decision: next, policyVersion: options.policyVersion, timestamp: Date.now() });
      setDecision(next);
      options.onDecision?.(next);
    },
    [options],
  );

  const isTrackingAllowed =
    decision === undefined
      ? shouldTrackByDefault(options.mode, options.hasGlobalPrivacyControlSignal ?? false)
      : decision === "granted";

  return {
    deny: () => {
      decide("denied");
    },
    grant: () => {
      decide("granted");
    },
    isTrackingAllowed,
    needsPrompt: options.mode === "opt-in" && decision === undefined,
  };
}
