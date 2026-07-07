import { useCallback, useEffect, useState } from "react";

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
  const [decision, setDecision] = useState<ConsentDecision | undefined>();

  // Read the stored decision after mount, not during the initial render: a prerendered page
  // can't see the visitor's localStorage, so an eager read here would return "granted" on the
  // client while the server always rendered "no decision yet" — a hydration mismatch that
  // leaves the banner's markup un-hydrated and stuck on screen for returning visitors.
  useEffect(() => {
    setDecision(options.storage.load()?.decision);
  }, [options.storage]);

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
