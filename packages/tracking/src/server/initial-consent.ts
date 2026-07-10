import type { ConsentCategory, InitialConsent } from "#/core/consent";
import { resolveConsentMode, resolveDefaultConsent } from "#/core/consent";
import { resolveRegionFromCountryCode } from "#/server/region";

export type { InitialConsent };

export interface BuildInitialConsentOptions {
  /** Categories the app's prompt asks about — opt-out regions grant exactly these by default. */
  categories: ReadonlyArray<ConsentCategory>;
  /** ISO 3166-1 alpha-2 from the geo header; missing → region `"other"`. */
  countryCode: string | undefined;
  /** Honored as an ads-only opt-out on the default decision. */
  hasGlobalPrivacyControlSignal?: boolean | undefined;
}

/**
 * Pure region → mode → default-consent resolution for SSR shells and edge middleware
 * payloads. When the geo header is absent on a prerender crawl, callers that want the
 * strictest fallback should skip this and supply their own all-denied opt-in default.
 */
export function buildInitialConsent(options: BuildInitialConsentOptions): InitialConsent {
  const region = resolveRegionFromCountryCode(options.countryCode);
  const mode = resolveConsentMode(region);

  return {
    defaultConsent: resolveDefaultConsent(mode, options.categories, options.hasGlobalPrivacyControlSignal ?? false),
    mode,
    region,
  };
}
