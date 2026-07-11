"use client";

import { useCallback, useMemo, useRef, useSyncExternalStore } from "react";

import type { ConsentCategory, ConsentDecision, ConsentMode, ConsentStorage } from "#/core/consent";
import { CONSENT_CATEGORIES, createConsentDecision, readStoredDecision, resolveDefaultConsent } from "#/core/consent";

/**
 * @since 0.5.0-canary.4
 */
export interface UseConsentOptions {
  hasGlobalPrivacyControlSignal?: boolean | undefined;
  mode: ConsentMode;
  onDecision?: ((decision: ConsentDecision) => void) | undefined;
  policyVersion: string;
  /**
   * Categories the app's prompt actually asks about — `grantAll` grants exactly these,
   * so an analytics-only banner can never grant ads consent it never asked for.
   * Defaults to `["analytics"]`.
   */
  requestedCategories?: ReadonlyArray<ConsentCategory> | undefined;
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
  /** Effective `analytics` consent — gates this package's own tracker pipeline. */
  isAnalyticsAllowed: boolean;
  /** True only for opt-in regions with no stored decision yet — drives whether to render the banner. */
  isPromptNeeded: boolean;
  /** Persist a granular per-category choice, e.g. from a preferences panel. */
  saveDecision: (decision: ConsentDecision) => void;
}

const DEFAULT_REQUESTED_CATEGORIES: ReadonlyArray<ConsentCategory> = ["analytics"];

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
  const { mode, onDecision, policyVersion, storage } = options;
  const requestedCategories = options.requestedCategories ?? DEFAULT_REQUESTED_CATEGORIES;
  const hasGlobalPrivacyControlSignal = options.hasGlobalPrivacyControlSignal ?? false;

  // useSyncExternalStore needs a referentially stable snapshot, but JSON-backed storages
  // parse a fresh record per load — so the last valid decision is cached by value.
  const cachedDecision = useRef<ConsentDecision | undefined>(undefined);

  const decision = useSyncExternalStore(
    storage.subscribe,
    (): ConsentDecision | undefined => {
      // Only a well-formed decision under the current policy version counts — the store
      // is tamperable plain JSON, and a garbage value must re-prompt, not silently deny.
      const stored = readStoredDecision(storage, policyVersion);

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

  // Kept stable across renders (when their own inputs don't change) so a consumer that
  // passes this hook's result down as a prop/effect-dep doesn't get a fresh identity —
  // and therefore an unnecessary re-render/effect-rerun — every render.
  const saveDecision = useCallback(
    (next: ConsentDecision): void => {
      // No local state — the save notifies the subscription, which re-renders with the new snapshot.
      storage.save({ decision: next, policyVersion, timestamp: Date.now() });
      onDecision?.(next);
    },
    [onDecision, policyVersion, storage],
  );

  const denyAll = useCallback(() => {
    saveDecision(createConsentDecision([]));
  }, [saveDecision]);

  const grantAll = useCallback(() => {
    saveDecision(createConsentDecision(requestedCategories));
  }, [requestedCategories, saveDecision]);

  const effectiveConsent =
    decision ?? resolveDefaultConsent({ hasGlobalPrivacyControlSignal, mode, requestedCategories });

  return useMemo(
    () => ({
      decision,
      denyAll,
      effectiveConsent,
      grantAll,
      isAnalyticsAllowed: effectiveConsent.analytics,
      isPromptNeeded: mode === "opt-in" && decision === undefined,
      saveDecision,
    }),
    [decision, denyAll, effectiveConsent, grantAll, mode, saveDecision],
  );
}
