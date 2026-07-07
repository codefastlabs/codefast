import { useSyncExternalStore } from "react";

import type { ConsentDecision, ConsentMode, ConsentStorage } from "#/core/consent";
import { shouldTrackByDefault } from "#/core/consent";

export interface UseConsentOptions {
  hasGlobalPrivacyControlSignal?: boolean;
  mode: ConsentMode;
  onDecision?: (decision: ConsentDecision) => void;
  policyVersion: string;
  /** Must be a stable reference (module-level or memoized) — a new object per render resubscribes every render. */
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
 * Bridges `resolveConsentMode`/`shouldTrackByDefault` (core, region-aware) to React via
 * `useSyncExternalStore`: the stored record is the single source of truth, hydration is
 * safe by construction (the server snapshot is always "no decision yet", matching what
 * prerendered HTML could know), and a decision made in another tab syncs through the
 * storage subscription.
 */
export function useConsent(options: UseConsentOptions): UseConsentResult {
  const { storage } = options;

  const decision = useSyncExternalStore(
    storage.subscribe,
    (): ConsentDecision | undefined => {
      const record = storage.load();

      // A decision recorded under an older policy version no longer counts.
      return record?.policyVersion === options.policyVersion ? record.decision : undefined;
    },
    () => undefined,
  );

  function decide(next: ConsentDecision): void {
    // No local state — the save notifies the subscription, which re-renders with the new snapshot.
    storage.save({ decision: next, policyVersion: options.policyVersion, timestamp: Date.now() });
    options.onDecision?.(next);
  }

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
