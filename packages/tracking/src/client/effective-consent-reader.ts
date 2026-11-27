import type { ConsentDecision, ConsentMode, ConsentStorage } from "#core/consent";
import { readStoredDecision, resolveEffectiveConsent } from "#core/consent";
import type { ConsentConfig } from "#core/consent-config";

/**
 * Options for `createEffectiveConsentReader`.
 *
 * @since 0.11.0
 */
export interface EffectiveConsentReaderOptions {
  /** Must be the same object `useConsent` receives — one config, every surface. */
  config: ConsentConfig;
  /**
   * Re-read each call. Pass `hasGlobalPrivacyControlSignal` from `@codefast/tracking/client`
   * (or a wrapper) so GPC changes apply without recreating the reader.
   */
  hasGlobalPrivacyControlSignal?: (() => boolean) | undefined;
  /** Re-read each call so a post-hydration region resolve can win. */
  getMode: () => ConsentMode;
  /** Must be the same storage instance `useConsent` subscribes to. */
  storage: ConsentStorage;
}

/**
 * Creates a non-React reader of `useConsent`'s `effectiveConsent` — pass it as
 * `createClientTracker({ getConsent })` so the pipeline and the banner share one rule.
 *
 * @since 0.11.0
 */
export function createEffectiveConsentReader(options: EffectiveConsentReaderOptions): () => ConsentDecision {
  const { config, getMode, storage } = options;
  const readGpc = options.hasGlobalPrivacyControlSignal ?? (() => false);

  return (): ConsentDecision =>
    resolveEffectiveConsent({
      hasGlobalPrivacyControlSignal: readGpc(),
      mode: getMode(),
      requestedCategories: config.requestedCategories,
      storedDecision: readStoredDecision(storage, config.policyVersion),
    });
}
