import type { ConsentCategory, ConsentMode, ConsentStorage } from "#/core/consent";
import { resolveEffectiveConsent } from "#/core/consent";

export interface CreateIsTrackingAllowedOptions {
  /** Categories the app's prompt asks about — must match `useConsent`'s `categories`. */
  categories: ReadonlyArray<ConsentCategory>;
  /** Current consent mode — re-read each call so a post-hydration region resolve can win. */
  getMode: () => ConsentMode;
  /**
   * Re-read each call. Pass `hasGlobalPrivacyControlSignal` from `@codefast/tracking/client`
   * (or a wrapper) so GPC changes apply without recreating the gate.
   */
  hasGlobalPrivacyControlSignal?: (() => boolean) | undefined;
  /** Must match `useConsent`'s `policyVersion`. */
  policyVersion: string;
  /** Must be the same storage instance `useConsent` subscribes to. */
  storage: ConsentStorage;
}

/**
 * Non-React mirror of `useConsent`'s `isTrackingAllowed` — pass the returned function as
 * `createClientTracker({ isTrackingAllowed })` so the pipeline and the banner share one rule.
 */
export function createIsTrackingAllowed(options: CreateIsTrackingAllowedOptions): () => boolean {
  const { categories, getMode, policyVersion, storage } = options;
  const readGpc = options.hasGlobalPrivacyControlSignal ?? (() => false);

  return (): boolean => {
    const effectiveConsent = resolveEffectiveConsent(storage, policyVersion, categories, getMode(), readGpc());

    return effectiveConsent.analytics;
  };
}
