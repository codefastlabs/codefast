import type { ConsentMode, ConsentStorage } from "#/core/consent";
import { resolveEffectiveConsent } from "#/core/consent";
import type { ConsentConfig } from "#/core/consent-config";

/**
 * @since 1.0.0-canary.6
 */
export interface IsAnalyticsAllowedOptions {
  /** Must be the same object `useConsent` receives — one config, every surface. */
  config: ConsentConfig;
  /**
   * Re-read each call. Pass `hasGlobalPrivacyControlSignal` from `@codefast/tracking/client`
   * (or a wrapper) so GPC changes apply without recreating the gate.
   */
  hasGlobalPrivacyControlSignal?: (() => boolean) | undefined;
  /** Re-read each call so a post-hydration region resolve can win. */
  getMode: () => ConsentMode;
  /** Must be the same storage instance `useConsent` subscribes to. */
  storage: ConsentStorage;
}

/**
 * Non-React mirror of `useConsent`'s `isAnalyticsAllowed` — pass the returned function as
 * `createClientTracker({ isAnalyticsAllowed })` so the pipeline and the banner share one rule.
 *
 * @since 1.0.0-canary.6
 */
export function createIsAnalyticsAllowed(options: IsAnalyticsAllowedOptions): () => boolean {
  const { config, getMode, storage } = options;
  const readGpc = options.hasGlobalPrivacyControlSignal ?? (() => false);

  return (): boolean => {
    const effectiveConsent = resolveEffectiveConsent({
      hasGlobalPrivacyControlSignal: readGpc(),
      mode: getMode(),
      policyVersion: config.policyVersion,
      requestedCategories: config.requestedCategories,
      storage,
    });

    return effectiveConsent.analytics;
  };
}
