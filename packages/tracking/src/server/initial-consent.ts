import type { ConsentCategory, InitialConsent } from "#/core/consent";
import { createConsentDecision, resolveConsentMode, resolveDefaultConsent } from "#/core/consent";
import { resolveRegionFromCountryCode } from "#/server/region";

export type { InitialConsent };

export interface BuildInitialConsentOptions {
  /** Categories the app's prompt asks about — opt-out regions grant exactly these by default. */
  categories: ReadonlyArray<ConsentCategory>;
  /** ISO 3166-1 alpha-2 from the geo header; missing → the strictest opt-in default. */
  countryCode: string | undefined;
  /** Honored as an ads-only opt-out on the default decision. */
  hasGlobalPrivacyControlSignal?: boolean | undefined;
}

/**
 * Pure region → mode → default-consent resolution for SSR shells and server functions.
 *
 * @remarks
 * A missing country code means an unknown visitor (a prerender crawl, a host without a
 * geo header) — not a known non-EU visitor — so it fails closed to the strictest opt-in
 * default instead of `"other"`'s opt-out. Conflating the two would grant analytics by
 * default to every visitor, EU included, on a geo-less host.
 */
export function buildInitialConsent(options: BuildInitialConsentOptions): InitialConsent {
  if (!options.countryCode) {
    return { defaultConsent: createConsentDecision([]), mode: "opt-in", region: "other" };
  }

  const region = resolveRegionFromCountryCode(options.countryCode);
  const mode = resolveConsentMode(region);

  return {
    defaultConsent: resolveDefaultConsent(mode, options.categories, options.hasGlobalPrivacyControlSignal ?? false),
    mode,
    region,
  };
}
