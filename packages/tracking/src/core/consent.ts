/**
 * @since 0.5.0-canary.4
 */
export type ConsentRegion = "eu" | "other" | "us" | "vn";

/**
 * @since 0.5.0-canary.4
 */
export type ConsentMode = "opt-in" | "opt-out";

/**
 * GDPR (EU) and the PDPL — Luật 91/2025/QH15 (VN) — require explicit opt-in before any non-essential
 * tracking; CCPA/CPRA (US) defaults to opt-out instead. There is no single global default
 * that satisfies both, so the mode is resolved per region.
 *
 * @since 0.5.0-canary.4
 */
export function resolveConsentMode(region: ConsentRegion): ConsentMode {
  switch (region) {
    case "eu":
    case "vn": {
      return "opt-in";
    }

    case "other":
    case "us": {
      return "opt-out";
    }
  }
}

/**
 * Consent purposes, mirroring Google Consent Mode v2's split: `analytics` gates
 * measurement (`analytics_storage`), `ads` gates advertising storage and data sharing
 * (`ad_storage`/`ad_user_data`/`ad_personalization`).
 *
 * @since 0.5.0-canary.4
 */
export type ConsentCategory = "ads" | "analytics";

/**
 * @since 0.5.0-canary.4
 */
export const CONSENT_CATEGORIES: ReadonlyArray<ConsentCategory> = ["ads", "analytics"];

/**
 * Per-category consent — GDPR consent must be granular per purpose, so a single
 * granted/denied flag can't represent it. `true` means the visitor granted that purpose.
 *
 * @since 0.5.0-canary.4
 */
export type ConsentDecision = Record<ConsentCategory, boolean>;

/**
 * A decision granting exactly the given categories and denying every other one.
 *
 * @since 0.5.0-canary.4
 */
export function createConsentDecision(grantedCategories: ReadonlyArray<ConsentCategory>): ConsentDecision {
  return { ads: grantedCategories.includes("ads"), analytics: grantedCategories.includes("analytics") };
}

/**
 * Guards stored JSON — the record is tamperable, so every category must be an explicit boolean.
 *
 * @since 0.5.0-canary.4
 */
export function isConsentDecision(value: unknown): value is ConsentDecision {
  return (
    typeof value === "object" &&
    value !== null &&
    CONSENT_CATEGORIES.every((category) => typeof (value as Record<string, unknown>)[category] === "boolean")
  );
}

/**
 * The effective consent before the visitor decides: opt-in regions start all-denied,
 * opt-out regions grant the categories the app asks for.
 *
 * @remarks
 * A Global Privacy Control signal is a "do not sell or share" opt-out (CCPA/CPRA), so it
 * forces `ads` denied — it does not withdraw first-party analytics measurement.
 *
 * @since 0.5.0-canary.4
 */
export function resolveDefaultConsent(
  mode: ConsentMode,
  requestedCategories: ReadonlyArray<ConsentCategory>,
  hasGlobalPrivacyControlSignal: boolean,
): ConsentDecision {
  if (mode === "opt-in") {
    return createConsentDecision([]);
  }

  const decision = createConsentDecision(requestedCategories);

  if (hasGlobalPrivacyControlSignal) {
    decision.ads = false;
  }

  return decision;
}

/**
 * Vietnam's PDPL and GDPR both expect a record of *when* and *under what policy* consent
 * was given, not just per-category flags — `policyVersion` lets a later policy change
 * invalidate stale consent.
 *
 * @since 0.5.0-canary.4
 */
export interface ConsentRecord {
  decision: ConsentDecision;
  policyVersion: string;
  timestamp: number;
}

/**
 * Persistence backend for the visitor's consent decision — swap in your own
 * implementation for non-browser environments or a different persistence layer.
 *
 * @since 0.5.0-canary.4
 */
export interface ConsentStorage {
  clear: () => void;
  load: () => ConsentRecord | undefined;
  save: (record: ConsentRecord) => void;
  /**
   * Notify on any change to the stored record, including writes from other tabs — this
   * is what drives `useConsent`'s external-store subscription. Returns an unsubscribe.
   */
  subscribe: (listener: () => void) => () => void;
}

/**
 * The stored decision if one exists under the current `policyVersion`, normalized to drop
 * any tampered extra keys — `undefined` if there is none yet, the record is malformed, or
 * it was recorded under a superseded policy version.
 */
export function readStoredDecision(storage: ConsentStorage, policyVersion: string): ConsentDecision | undefined {
  const record = storage.load();

  if (record?.policyVersion !== policyVersion || !isConsentDecision(record.decision)) {
    return undefined;
  }

  const stored = record.decision;

  return createConsentDecision(CONSENT_CATEGORIES.filter((category) => stored[category]));
}

/**
 * The consent a tracker should honor right now: the stored decision if one exists, else
 * the region default — the same rule `useConsent` applies to its `effectiveConsent`, so a
 * non-React gate (e.g. a tracker's `isTrackingAllowed` option) doesn't have to reimplement
 * "read storage, validate the policy version, fall back to `resolveDefaultConsent`" itself.
 */
export function resolveEffectiveConsent(
  storage: ConsentStorage,
  policyVersion: string,
  requestedCategories: ReadonlyArray<ConsentCategory>,
  mode: ConsentMode,
  hasGlobalPrivacyControlSignal: boolean,
): ConsentDecision {
  return (
    readStoredDecision(storage, policyVersion) ??
    resolveDefaultConsent(mode, requestedCategories, hasGlobalPrivacyControlSignal)
  );
}
