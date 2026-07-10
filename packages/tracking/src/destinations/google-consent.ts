import type { ConsentCategory, ConsentDecision } from "#/core/consent";
import { CONSENT_CATEGORIES } from "#/core/consent";

/** gtag.js/gtm.js's default queue-array name — shared so the gtag and GTM helpers cannot disagree. */
export const DEFAULT_DATA_LAYER_NAME = "dataLayer";

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
const GOOGLE_CONSENT_SIGNAL_CATEGORIES = {
  ad_personalization: "ads",
  ad_storage: "ads",
  ad_user_data: "ads",
  analytics_storage: "analytics",
} as const satisfies Record<
  "ad_personalization" | "ad_storage" | "ad_user_data" | "analytics_storage",
  ConsentCategory
>;

type GoogleConsentSignal = keyof typeof GOOGLE_CONSENT_SIGNAL_CATEGORIES;

/** Maps a package `ConsentDecision` onto Consent Mode v2's four storage signals. */
export function toGoogleConsentParams(decision: ConsentDecision): GoogleConsentParams {
  // Derived from the signal map (not hand-written per signal) so the runtime params and
  // the bootstrap fragment below can never disagree; the cast rebuilds what
  // Object.fromEntries erases — every map key is present exactly once.
  return Object.fromEntries(
    (Object.entries(GOOGLE_CONSENT_SIGNAL_CATEGORIES) as Array<[GoogleConsentSignal, ConsentCategory]>).map(
      ([signal, category]) => [signal, decision[category] ? "granted" : "denied"],
    ),
  ) as unknown as GoogleConsentParams;
}

/** JS fragment that validates a stored `ConsentRecord.decision` shape inside a bootstrap. */
function consentDecisionShapeCheckExpression(): string {
  return CONSENT_CATEGORIES.map((category) => `typeof record.decision[${JSON.stringify(category)}] === "boolean"`).join(
    " && ",
  );
}

/**
 * JS object-literal fragment for `gtag("consent", "default", { … })` — generated from
 * {@link GOOGLE_CONSENT_SIGNAL_CATEGORIES} so runtime and bootstrap stay aligned.
 */
function consentSignalAssignmentsExpression(): string {
  return (Object.entries(GOOGLE_CONSENT_SIGNAL_CATEGORIES) as Array<[GoogleConsentSignal, ConsentCategory]>)
    .map(([signal, category]) => `${signal}: consent.${category} ? "granted" : "denied"`)
    .join(",\n      ");
}

export interface GoogleConsentBootstrapPreambleOptions {
  /** localStorage key holding the package's `ConsentRecord`. */
  consentStorageKey: string;
  dataLayerName: string;
  /** Literal fallback when nothing valid is stored — baked into the script as JSON. */
  defaultConsent: ConsentDecision;
  policyVersion: string;
}

/**
 * Shared head of the gtag and GTM consent bootstraps: dataLayer init, `gtag()` stub,
 * stored-decision read (policy-version + shape checked), and the Consent Mode v2
 * "default" signal. The builders append only their tag-specific tail, so the consent
 * logic cannot drift between them.
 */
export function googleConsentBootstrapPreamble(options: GoogleConsentBootstrapPreambleOptions): string {
  const dataLayerAccess = `window[${JSON.stringify(options.dataLayerName)}]`;

  return `
    ${dataLayerAccess} = ${dataLayerAccess} || [];
    function gtag(){${dataLayerAccess}.push(arguments);}
    var storedConsent = null;
    try {
      var record = JSON.parse(window.localStorage.getItem(${JSON.stringify(options.consentStorageKey)}));
      if (record && record.policyVersion === ${JSON.stringify(options.policyVersion)} && record.decision && ${consentDecisionShapeCheckExpression()}) {
        storedConsent = record.decision;
      }
    } catch (e) {}
    var consent = storedConsent || (${JSON.stringify(options.defaultConsent)});
    gtag("consent", "default", {
      ${consentSignalAssignmentsExpression()}
    });`;
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

function isGa4EventName(name: string): boolean {
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
