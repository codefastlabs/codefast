import type { ConsentDecision } from "#core/consent";

/**
 * The normalized two-lever ad-platform consent state derived from one `{ ads, analytics }`
 * decision (spec-destinations §5): whether events transmit at all, and whether they carry
 * Limited Data Use. Every ad destination consumes this same shape so per-vendor mappings
 * cannot drift.
 *
 * @since 0.5.0-canary.6
 */
export interface AdConsentState {
  /** `ads` denied → the platform must restrict to Limited Data Use (Meta/TikTok LDU, UET `ad_storage` denied). */
  limitedDataUse: boolean;
  /**
   * `ads` granted, or — where Limited Data Use substitutes for `ads` — `analytics` granted, since LDU leaves only
   * restricted measurement processing and that is the purpose the visitor must still allow. Else send nothing.
   */
  transmissionAllowed: boolean;
}

/**
 * Options for `toAdConsentState`.
 */
export interface AdConsentStateOptions {
  /**
   * Whether delivering under Limited Data Use is a lawful substitute for an `ads` grant —
   * true only under an opt-out regime (a US "do not sell or share" opt-out), never opt-in,
   * where an ad platform without `ads` consent must receive nothing.
   *
   * @defaultValue false
   */
  isLimitedDataUseAllowed?: boolean | undefined;
}

/**
 * Normalizes a package `ConsentDecision` to the vendor-agnostic {@link AdConsentState}.
 *
 * @since 0.5.0-canary.6
 */
export function toAdConsentState(decision: ConsentDecision, options: AdConsentStateOptions = {}): AdConsentState {
  return {
    limitedDataUse: !decision.ads,
    transmissionAllowed: decision.ads || (options.isLimitedDataUseAllowed === true && decision.analytics),
  };
}
