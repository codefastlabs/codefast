/**
 * @since 0.5.0-canary.4
 */
export type ConsentRegion = "eu" | "other" | "us" | "vn";

export const CONSENT_REGIONS: ReadonlyArray<ConsentRegion> = ["eu", "other", "us", "vn"];

/** Guards a region read from untrusted storage (a cached `InitialConsent`, a cookie). */
export function isConsentRegion(value: unknown): value is ConsentRegion {
  return CONSENT_REGIONS.includes(value as ConsentRegion);
}

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Guards stored JSON — the record is tamperable, so every category must be an explicit boolean.
 *
 * @since 0.5.0-canary.4
 */
export function isConsentDecision(value: unknown): value is ConsentDecision {
  return isPlainObject(value) && CONSENT_CATEGORIES.every((category) => typeof value[category] === "boolean");
}

/** Guards a persisted consent record read from untrusted storage (e.g. `localStorage`). */
export function isConsentRecord(value: unknown): value is ConsentRecord {
  return (
    isPlainObject(value) &&
    isConsentDecision(value.decision) &&
    typeof value.policyVersion === "string" &&
    typeof value.timestamp === "number"
  );
}

/**
 * @since 0.5.0-canary.4
 */
export interface ResolveDefaultConsentOptions {
  /** A "do not sell or share" opt-out — forces `ads` denied under opt-out regions. */
  hasGlobalPrivacyControlSignal: boolean;
  mode: ConsentMode;
  requestedCategories: ReadonlyArray<ConsentCategory>;
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
export function resolveDefaultConsent(options: ResolveDefaultConsentOptions): ConsentDecision {
  const { hasGlobalPrivacyControlSignal, mode, requestedCategories } = options;

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
 * Region-resolved consent defaults — typically from `buildInitialConsent` on a
 * per-request server lane, then handed to the client so it never re-guesses the mode.
 *
 * @remarks
 * Drive UI and gates from `mode` (recompute `effectiveConsent` with live navigator GPC).
 * `defaultConsent` is the server snapshot — useful when you need request-time `sec-gpc`
 * as-is; analytics-only apps can ignore it because GPC only forces `ads` denied.
 */
export interface InitialConsent {
  defaultConsent: ConsentDecision;
  mode: ConsentMode;
  region: ConsentRegion;
}

/**
 * What shared HTML bakes and what an unknown-country request resolves to: all categories
 * denied under opt-in — the one default that is safe to show any visitor anywhere.
 * Prerendered/CDN-cached markup must carry nothing region-specific, and a missing geo
 * header means "unknown visitor", never "known non-EU visitor".
 */
export const STRICTEST_INITIAL_CONSENT: InitialConsent = Object.freeze({
  defaultConsent: Object.freeze(createConsentDecision([])),
  mode: "opt-in",
  region: "other",
});

/**
 * Guards an `InitialConsent` read from untrusted storage (a session cache, a cookie).
 * Enforces the mode/region pairing rule, allowing the one deliberate exception: the
 * fail-closed unknown-country value pairs `opt-in` with region `"other"` — stricter than
 * `"other"`'s usual opt-out, never looser.
 */
export function isInitialConsent(value: unknown): value is InitialConsent {
  if (!isPlainObject(value)) {
    return false;
  }

  const mode = value.mode;
  const region = value.region;

  if (
    (mode !== "opt-in" && mode !== "opt-out") ||
    !isConsentRegion(region) ||
    !isConsentDecision(value.defaultConsent)
  ) {
    return false;
  }

  return mode === resolveConsentMode(region) || (mode === "opt-in" && region === "other");
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

export interface ResolveEffectiveConsentOptions {
  /** A "do not sell or share" opt-out — forces `ads` denied under opt-out regions. */
  hasGlobalPrivacyControlSignal: boolean;
  mode: ConsentMode;
  policyVersion: string;
  requestedCategories: ReadonlyArray<ConsentCategory>;
  storage: ConsentStorage;
}

/**
 * The consent a tracker should honor right now: the stored decision if one exists, else
 * the region default — the same rule `useConsent` applies to its `effectiveConsent`, so a
 * non-React gate (e.g. a tracker's `isAnalyticsAllowed` option) doesn't have to reimplement
 * "read storage, validate the policy version, fall back to `resolveDefaultConsent`" itself.
 */
export function resolveEffectiveConsent(options: ResolveEffectiveConsentOptions): ConsentDecision {
  const { hasGlobalPrivacyControlSignal, mode, policyVersion, requestedCategories, storage } = options;

  return (
    readStoredDecision(storage, policyVersion) ??
    resolveDefaultConsent({ hasGlobalPrivacyControlSignal, mode, requestedCategories })
  );
}
