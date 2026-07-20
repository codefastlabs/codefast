import type { ConsentDecision } from "#/core/consent";

/**
 * The normalized two-lever ad-platform consent state derived from one `{ ads, analytics }`
 * decision (spec-destinations §5): `analytics` drives whether events transmit at all, and
 * `ads` drives Limited Data Use. The levers are independent — a US opt-out (`ads: false`)
 * restricts to LDU but MUST NOT withhold first-party `analytics` (spec-consent §3). Every
 * ad destination consumes this same shape so per-vendor mappings cannot drift.
 *
 * @since 1.0.0-canary.7
 */
export interface AdConsentState {
  /** `ads` denied → the platform must restrict to Limited Data Use (Meta/TikTok LDU, UET `ad_storage` denied). */
  limitedDataUse: boolean;
  /** `analytics` granted → events may transmit; denied → hold/revoke and send nothing. */
  transmissionAllowed: boolean;
}

/**
 * Normalizes a package `ConsentDecision` to the vendor-agnostic {@link AdConsentState}.
 *
 * @since 1.0.0-canary.7
 */
export function toAdConsentState(decision: ConsentDecision): AdConsentState {
  return {
    limitedDataUse: !decision.ads,
    transmissionAllowed: decision.analytics,
  };
}
