import { useRef, useSyncExternalStore } from "react";

import type { ConsentCategory, ConsentDecision, ConsentMode, ConsentStorage } from "#/core/consent";
import { CONSENT_CATEGORIES, createConsentDecision, readStoredDecision, resolveDefaultConsent } from "#/core/consent";

/**
 * @since 0.5.0-canary.4
 */
export interface UseConsentOptions {
  /**
   * Categories the app's prompt actually asks about — `grantAll` grants exactly these,
   * so an analytics-only banner can never grant ads consent it never asked for.
   * Defaults to `["analytics"]`.
   */
  categories?: ReadonlyArray<ConsentCategory>;
  hasGlobalPrivacyControlSignal?: boolean;
  mode: ConsentMode;
  onDecision?: (decision: ConsentDecision) => void;
  policyVersion: string;
  /** Must be a stable reference (module-level or memoized) — a new object per render resubscribes every render. */
  storage: ConsentStorage;
}

/**
 * @since 0.5.0-canary.4
 */
export interface UseConsentResult {
  /** The stored decision under the current policy version — `undefined` until the visitor makes one. */
  decision: ConsentDecision | undefined;
  denyAll: () => void;
  /** What tags must obey right now — the stored decision, or the region default before one exists. */
  effectiveConsent: ConsentDecision;
  grantAll: () => void;
  /** True only for opt-in regions with no stored decision yet — drives whether to render the banner. */
  isPromptNeeded: boolean;
  /** Effective `analytics` consent — gates this package's own tracker pipeline. */
  isTrackingAllowed: boolean;
  /** Persist a granular per-category choice, e.g. from a preferences panel. */
  save: (decision: ConsentDecision) => void;
}

const DEFAULT_CATEGORIES: ReadonlyArray<ConsentCategory> = ["analytics"];

/**
 * Bridges `resolveConsentMode`/`resolveDefaultConsent` (core, region-aware) to React via
 * `useSyncExternalStore`: the stored record is the single source of truth, hydration is
 * safe by construction (the server snapshot is always "no decision yet", matching what
 * prerendered HTML could know), and a decision made in another tab syncs through the
 * storage subscription.
 *
 * @since 0.5.0-canary.4
 */
export function useConsent(options: UseConsentOptions): UseConsentResult {
  const { storage } = options;
  const categories = options.categories ?? DEFAULT_CATEGORIES;

  // useSyncExternalStore needs a referentially stable snapshot, but JSON-backed storages
  // parse a fresh record per load — so the last valid decision is cached by value.
  const cachedDecision = useRef<ConsentDecision | undefined>(undefined);

  const decision = useSyncExternalStore(
    storage.subscribe,
    (): ConsentDecision | undefined => {
      // Only a well-formed decision under the current policy version counts — the store
      // is tamperable plain JSON, and a garbage value must re-prompt, not silently deny.
      const stored = readStoredDecision(storage, options.policyVersion);

      if (stored === undefined) {
        cachedDecision.current = undefined;

        return undefined;
      }

      const cached = cachedDecision.current;

      if (cached !== undefined && CONSENT_CATEGORIES.every((category) => cached[category] === stored[category])) {
        return cached;
      }

      cachedDecision.current = stored;

      return cachedDecision.current;
    },
    () => undefined,
  );

  function save(next: ConsentDecision): void {
    // No local state — the save notifies the subscription, which re-renders with the new snapshot.
    storage.save({ decision: next, policyVersion: options.policyVersion, timestamp: Date.now() });
    options.onDecision?.(next);
  }

  const effectiveConsent =
    decision ?? resolveDefaultConsent(options.mode, categories, options.hasGlobalPrivacyControlSignal ?? false);

  return {
    decision,
    denyAll: () => {
      save(createConsentDecision([]));
    },
    effectiveConsent,
    grantAll: () => {
      save(createConsentDecision(categories));
    },
    isPromptNeeded: options.mode === "opt-in" && decision === undefined,
    isTrackingAllowed: effectiveConsent.analytics,
    save,
  };
}
