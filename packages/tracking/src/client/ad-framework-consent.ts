import type { ConsentCategory, ConsentDecision } from "#/core/consent";

/**
 * TCF/GPP interop reconciler (spec-ad-consent-frameworks): the system **reads** an external
 * CMP and reconciles it with the native `{ ads, analytics }` decision — it never becomes a
 * CMP, mints TC/GPP strings, or hard-codes TCF purpose ids or the Google vendor id (that
 * mapping is ad-ops policy, so the caller derives `CmpConsentSignal` and passes it in).
 */

/**
 * Liveness of a detected CMP. `"out-of-scope"` is TCF `gdprApplies === false` / no applicable
 * GPP section — the framework does not govern this user, so native consent stands.
 */
export type CmpStatus = "loading" | "out-of-scope" | "ready";

/** A CMP's governance over the native decision, already derived from TCData/GPP by ad-ops policy. */
export interface CmpConsentSignal {
  /** Per-governed-category grant, read once `status` is `"ready"`. */
  decision?: Partial<ConsentDecision> | undefined;
  /** Categories this CMP governs in the current scope — the resolver overrides only these. */
  governs: ReadonlyArray<ConsentCategory>;
  status: CmpStatus;
}

export interface ReconcileAdFrameworkConsentOptions {
  /** The live CMP signal, or omitted when no CMP is present (the resolver is then inert). */
  cmp?: CmpConsentSignal | undefined;
  /** Native GPC — can only tighten `ads`, never loosen a CMP grant. */
  hasGlobalPrivacyControlSignal: boolean;
  /** The stored/default decision that stands wherever no CMP governs. */
  native: ConsentDecision;
}

/**
 * Reconciles native consent with a CMP source of truth per spec-ad-consent-frameworks §3:
 * a governing CMP overrides its categories (fail-closed to denied while loading); a missing
 * or out-of-scope CMP leaves native standing; GPC always tightens `ads` last.
 */
export function reconcileAdFrameworkConsent(options: ReconcileAdFrameworkConsentOptions): ConsentDecision {
  const result: ConsentDecision = { ...options.native };
  const { cmp } = options;

  // A governing CMP overrides only the categories it governs; no CMP / out-of-scope leaves native.
  if (cmp && cmp.status !== "out-of-scope") {
    for (const category of cmp.governs) {
      // Fail closed until the CMP resolves; otherwise the CMP value wins for its categories.
      result[category] = cmp.status === "loading" ? false : (cmp.decision?.[category] ?? false);
    }
  }

  // GPC can only tighten `ads` — applied last so it wins over any CMP grant.
  if (options.hasGlobalPrivacyControlSignal) {
    result.ads = false;
  }

  return result;
}

/** Detects a TCF CMP without reading it — `typeof __tcfapi === "function"` (spec §3). */
export function hasTcfApi(scope: { __tcfapi?: unknown } = globalThis as { __tcfapi?: unknown }): boolean {
  return typeof scope.__tcfapi === "function";
}

/** Detects a GPP CMP without reading it — `typeof __gpp === "function"` (spec §3). */
export function hasGppApi(scope: { __gpp?: unknown } = globalThis as { __gpp?: unknown }): boolean {
  return typeof scope.__gpp === "function";
}
