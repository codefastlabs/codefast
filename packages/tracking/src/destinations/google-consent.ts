import type { ConsentCategory, ConsentDecision } from "#/core/consent";
import { CONSENT_CATEGORIES } from "#/core/consent";

type GoogleConsentState = "denied" | "granted";

/**
 * Consent Mode v2 params issued via `gtag('consent', …)` — shared by the gtag and GTM
 * bootstraps so signal mapping cannot drift between them.
 */
export interface GoogleConsentParams {
  ad_personalization: GoogleConsentState;
  ad_storage: GoogleConsentState;
  ad_user_data: GoogleConsentState;
  analytics_storage: GoogleConsentState;
  region?: ReadonlyArray<string> | undefined;
  wait_for_update?: number | undefined;
}

/**
 * Which per-category decision each Consent Mode v2 signal follows: `analytics` drives
 * `analytics_storage`; `ads` drives all three ads signals together.
 */
export const GOOGLE_CONSENT_SIGNAL_CATEGORIES = {
  ad_personalization: "ads",
  ad_storage: "ads",
  ad_user_data: "ads",
  analytics_storage: "analytics",
} as const satisfies Record<
  "ad_personalization" | "ad_storage" | "ad_user_data" | "analytics_storage",
  ConsentCategory
>;

export type GoogleConsentSignal = keyof typeof GOOGLE_CONSENT_SIGNAL_CATEGORIES;

/** Maps a package `ConsentDecision` onto Consent Mode v2's four storage signals. */
export function toGoogleConsentParams(decision: ConsentDecision): GoogleConsentParams {
  const params = {
    ad_personalization: decision.ads ? "granted" : "denied",
    ad_storage: decision.ads ? "granted" : "denied",
    ad_user_data: decision.ads ? "granted" : "denied",
    analytics_storage: decision.analytics ? "granted" : "denied",
  } satisfies GoogleConsentParams;

  return params;
}

/** JS fragment that validates a stored `ConsentRecord.decision` shape inside a bootstrap. */
export function consentDecisionShapeCheckExpression(recordExpression = "record.decision"): string {
  return CONSENT_CATEGORIES.map(
    (category) => `typeof ${recordExpression}[${JSON.stringify(category)}] === "boolean"`,
  ).join(" && ");
}

/**
 * JS object-literal fragment for `gtag("consent", "default", { … })` — generated from
 * {@link GOOGLE_CONSENT_SIGNAL_CATEGORIES} so runtime and bootstrap stay aligned.
 */
export function consentSignalAssignmentsExpression(consentExpression = "consent"): string {
  return (Object.entries(GOOGLE_CONSENT_SIGNAL_CATEGORIES) as Array<[GoogleConsentSignal, ConsentCategory]>)
    .map(([signal, category]) => `${signal}: ${consentExpression}.${category} ? "granted" : "denied"`)
    .join(",\n      ");
}

/** Reads or creates a named `window[dataLayerName]` queue array. */
export function dataLayerOf(dataLayerName: string): Array<unknown> | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const win = window as unknown as Record<string, unknown>;
  const existing = win[dataLayerName];

  win[dataLayerName] = Array.isArray(existing) ? existing : [];

  return win[dataLayerName] as Array<unknown>;
}

/**
 * GA4's event-name rules (letter start, letters/digits/underscores only, ≤40 chars).
 * Catalog `track` names that fail this are accepted by gtag/MP HTTP but dropped at GA4
 * processing with no client error — destinations warn and skip instead of sending nowhere.
 */
const GA4_EVENT_NAME_PATTERN = /^[A-Za-z][\w]{0,39}$/;

export function isGa4EventName(name: string): boolean {
  return GA4_EVENT_NAME_PATTERN.test(name);
}

/** Warns and returns `false` when `eventName` would be rejected by GA4. */
export function warnUnlessGa4EventName(destinationName: string, eventName: string): boolean {
  if (isGa4EventName(eventName)) {
    return true;
  }

  console.warn(
    `[tracking] "${destinationName}" dropped event "${eventName}" — GA4 event names must start with a letter and contain only letters, digits, or underscores (max 40 chars)`,
  );

  return false;
}
