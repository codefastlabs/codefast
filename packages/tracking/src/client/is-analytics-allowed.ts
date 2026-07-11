import type { ConsentCategory, ConsentMode, ConsentStorage } from "#/core/consent";
import { resolveEffectiveConsent } from "#/core/consent";

export interface CreateIsAnalyticsAllowedOptions {
  /**
   * Re-read each call. Pass `hasGlobalPrivacyControlSignal` from `@codefast/tracking/client`
   * (or a wrapper) so GPC changes apply without recreating the gate.
   */
  getHasGlobalPrivacyControlSignal?: (() => boolean) | undefined;
  /** Re-read each call so a post-hydration region resolve can win. */
  getMode: () => ConsentMode;
  /** Must match `useConsent`'s `policyVersion`. */
  policyVersion: string;
  /** Categories the app's prompt asks about — must match `useConsent`'s `requestedCategories`. */
  requestedCategories: ReadonlyArray<ConsentCategory>;
  /** Must be the same storage instance `useConsent` subscribes to. */
  storage: ConsentStorage;
}

/**
 * Non-React mirror of `useConsent`'s `isAnalyticsAllowed` — pass the returned function as
 * `createClientTracker({ isAnalyticsAllowed })` so the pipeline and the banner share one rule.
 */
export function createIsAnalyticsAllowed(options: CreateIsAnalyticsAllowedOptions): () => boolean {
  const { getMode, policyVersion, requestedCategories, storage } = options;
  const readGpc = options.getHasGlobalPrivacyControlSignal ?? (() => false);

  return (): boolean => {
    const effectiveConsent = resolveEffectiveConsent(storage, policyVersion, requestedCategories, getMode(), readGpc());

    return effectiveConsent.analytics;
  };
}
