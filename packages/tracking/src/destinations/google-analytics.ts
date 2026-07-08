import type { ConsentDecision } from "#/core/consent";
import { CONSENT_CATEGORIES } from "#/core/consent";
import type { Destination } from "#/core/destination";

type GtagPropertyValue = boolean | number | string;

type GoogleConsentState = "denied" | "granted";

interface GoogleConsentParams {
  ad_personalization: GoogleConsentState;
  ad_storage: GoogleConsentState;
  ad_user_data: GoogleConsentState;
  analytics_storage: GoogleConsentState;
  region?: ReadonlyArray<string>;
  wait_for_update?: number;
}

/**
 * All signatures share one `gtag` global, so they must live in a single overloaded type —
 * two separate `declare global` augmentations with different signatures for the same
 * property is a TS error, not a merge.
 */
type GtagFunction = {
  (command: "config", targetId: string, params?: Record<string, GtagPropertyValue>): void;
  (command: "consent", action: "default" | "update", params: GoogleConsentParams): void;
  (command: "event", eventName: string, params?: Record<string, GtagPropertyValue>): void;
  (command: "js", startDate: Date): void;
  (command: "set", params: Record<string, GtagPropertyValue>): void;
  (command: "set", key: string, value: boolean): void;
};

declare global {
  interface Window {
    dataLayer?: Array<unknown>;
    gtag?: GtagFunction;
  }
}

/**
 * The visitor's per-category decision maps onto Consent Mode v2's signals: `analytics`
 * drives `analytics_storage`; `ads` drives all three ads signals together — a banner
 * that got ads consent got it for storage, sharing, and personalization alike.
 */
function toGoogleConsentParams(decision: ConsentDecision): GoogleConsentParams {
  const ads: GoogleConsentState = decision.ads ? "granted" : "denied";

  return {
    ad_personalization: ads,
    ad_storage: ads,
    ad_user_data: ads,
    analytics_storage: decision.analytics ? "granted" : "denied",
  };
}

/**
 * Ensures the standard gtag.js queueing stub exists so consent commands can be issued
 * before the tag itself loads — gtag.js replays the queue in order once it boots.
 */
function ensureGtag(): GtagFunction | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  window.dataLayer ??= [];

  // gtag.js requires the live Arguments object on the dataLayer — pushing an array is
  // treated as a GTM message, not a gtag command.
  window.gtag ??= function gtag() {
    window.dataLayer?.push(arguments);
  } as GtagFunction;

  return window.gtag;
}

/**
 * @since 0.5.0-canary.4
 */
export interface GoogleConsentDefaultOptions {
  /** Restrict the default to these ISO 3166-2 codes (gtag's `region` param); omit for a global default. */
  region?: ReadonlyArray<string>;
  /** Consent Mode's `wait_for_update` — how long tags hold hits so a stored decision can arrive as an update first. */
  waitForUpdateMs?: number;
}

/**
 * Google Consent Mode v2's "default" signal — call before the gtag.js script tag loads
 * (this defines the queueing stub itself, so no snippet has to run first) with the
 * region-resolved default, so GA4/Ads never fire a hit ahead of it.
 *
 * @since 0.5.0-canary.4
 */
export function setGoogleConsentDefault(decision: ConsentDecision, options: GoogleConsentDefaultOptions = {}): void {
  const params = toGoogleConsentParams(decision);

  if (options.region !== undefined) {
    params.region = options.region;
  }

  if (options.waitForUpdateMs !== undefined) {
    params.wait_for_update = options.waitForUpdateMs;
  }

  ensureGtag()?.("consent", "default", params);
}

/**
 * Google Consent Mode v2's "update" signal — call whenever the visitor's effective
 * consent changes (a banner decision, or one synced from another tab), so already-loaded
 * GA4/Ads tags pick up the change without a page reload.
 *
 * @since 0.5.0-canary.4
 */
export function updateGoogleConsent(decision: ConsentDecision): void {
  ensureGtag()?.("consent", "update", toGoogleConsentParams(decision));
}

/**
 * @since 0.6.0-canary.0
 */
export interface GtagConsentBootstrapOptions {
  /** localStorage key holding the package's `ConsentRecord` — must match `useConsent`'s `storage`. */
  consentStorageKey: string;
  /**
   * Consent to apply when nothing valid is stored yet. Embedded as a literal — for a
   * value only known via an earlier inline script (e.g. a middleware-set cookie read on a
   * statically prerendered page), use `defaultConsentExpression` instead.
   */
  defaultConsent?: ConsentDecision;
  /**
   * A raw JS expression evaluating to the fallback `ConsentDecision`, e.g.
   * `"window.__INITIAL_CONSENT__.defaultConsent"`. Takes precedence over `defaultConsent`
   * when both are set; one of the two is required.
   */
  defaultConsentExpression?: string;
  /** Google Analytics 4 Measurement ID (e.g. `"G-XXXXXXX"`). */
  gaMeasurementId: string;
  /** Must match `useConsent`'s `policyVersion` — a decision under any other version is ignored. */
  policyVersion: string;
}

/**
 * Builds the literal JS source for a `<script dangerouslySetInnerHTML>` mounted in
 * `<head>`, before hydration: applies Consent Mode v2's default signal from the visitor's
 * stored decision (falling back to `defaultConsent`/`defaultConsentExpression` when none is
 * stored yet), then, in basic Consent Mode, loads gtag.js only once analytics is granted —
 * a denied visitor's browser never pings Google. A runtime grant (banner Accept, a settings
 * toggle) needs `updateGoogleConsent` plus loading gtag.js separately; this only covers the
 * page-load state.
 *
 * @since 0.6.0-canary.0
 */
export function buildGtagConsentBootstrapScript(options: GtagConsentBootstrapOptions): string {
  const { consentStorageKey, defaultConsent, defaultConsentExpression, gaMeasurementId, policyVersion } = options;

  if (defaultConsentExpression === undefined && defaultConsent === undefined) {
    throw new Error("[tracking] buildGtagConsentBootstrapScript requires defaultConsent or defaultConsentExpression");
  }

  const fallbackExpression = defaultConsentExpression ?? JSON.stringify(defaultConsent);
  const decisionShapeCheck = CONSENT_CATEGORIES.map(
    (category) => `typeof record.decision[${JSON.stringify(category)}] === "boolean"`,
  ).join(" && ");
  const gtagScriptUrl = `https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`;

  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    var storedConsent = null;
    try {
      var record = JSON.parse(window.localStorage.getItem(${JSON.stringify(consentStorageKey)}));
      if (record && record.policyVersion === ${JSON.stringify(policyVersion)} && record.decision && ${decisionShapeCheck}) {
        storedConsent = record.decision;
      }
    } catch (e) {}
    var consent = storedConsent || (${fallbackExpression});
    gtag("consent", "default", {
      ad_personalization: consent.ads ? "granted" : "denied",
      ad_storage: consent.ads ? "granted" : "denied",
      ad_user_data: consent.ads ? "granted" : "denied",
      analytics_storage: consent.analytics ? "granted" : "denied",
    });
    if (consent.analytics) {
      gtag("js", new Date());
      gtag("config", ${JSON.stringify(gaMeasurementId)});
      var gtagScript = document.createElement("script");
      gtagScript.async = true;
      gtagScript.src = ${JSON.stringify(gtagScriptUrl)};
      document.head.appendChild(gtagScript);
    }
  `;
}

/**
 * Consent Mode's `ads_data_redaction` flag — with `ad_storage` denied, gtag further
 * redacts ad click identifiers (gclid/dclid) from its cookieless pings. Set alongside
 * the consent default.
 *
 * @since 0.5.0-canary.4
 */
export function setGoogleAdsDataRedaction(enabled: boolean): void {
  ensureGtag()?.("set", "ads_data_redaction", enabled);
}

/**
 * Consent Mode's `url_passthrough` flag — carries ad click info through page URLs while
 * storage is denied, preserving conversion attribution without cookies.
 *
 * @since 0.5.0-canary.4
 */
export function setGoogleUrlPassthrough(enabled: boolean): void {
  ensureGtag()?.("set", "url_passthrough", enabled);
}

/**
 * gtag.js event params must be flat string/number/boolean — stringify anything else
 * instead of letting GA4 silently drop it.
 */
function toGtagParams(props: Record<string, unknown>): Record<string, GtagPropertyValue> {
  const result: Record<string, GtagPropertyValue> = {};

  for (const [key, value] of Object.entries(props)) {
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      result[key] = value;
    } else if (value !== undefined && value !== null) {
      result[key] = JSON.stringify(value);
    }
  }

  return result;
}

// GA4 rejects event names that don't start with a letter or exceed 40 chars — an invalid
// catalog name would be dropped at processing without any signal to the dev.
const GA4_EVENT_NAME_PATTERN = /^[A-Za-z][\w]{0,39}$/;

/**
 * @since 0.5.0-canary.4
 */
export interface GoogleAnalyticsDestinationOptions {
  name?: string;
  /**
   * Forward `$page_viewed` as GA4's `page_view`. Off by default: `gtag('config', ...)`
   * sends the initial page_view and GA4's Enhanced Measurement (on by default in admin)
   * tracks SPA history changes, so forwarding here would double-count. Enable only after
   * setting `send_page_view: false` on config and disabling Enhanced Measurement's
   * history-based page views.
   */
  trackPageViews?: boolean;
}

/**
 * Forwards events to `window.gtag`, translating each envelope kind to GA4's vocabulary —
 * `identify` sets `user_id`, `group` becomes the recommended `join_group` event, `page`
 * maps to `page_view` (opt-in, see `trackPageViews`), and `alias` is ignored (GA4 merges
 * identity via `user_id` on later hits). Requires the gtag.js snippet plus
 * `gtag('config', measurementId)` mounted once by the app. Marked
 * `delivery: "immediate"` — gtag.js has its own batching and unload delivery, so
 * queueing in front of it only delays events and replays stale ones next session.
 *
 * @since 0.5.0-canary.4
 */
export function createGoogleAnalyticsDestination(options: GoogleAnalyticsDestinationOptions = {}): Destination {
  const name = options.name ?? "google-analytics";

  return {
    delivery: "immediate",
    name,
    send(event) {
      if (typeof window === "undefined" || typeof window.gtag !== "function") {
        return;
      }

      switch (event.type) {
        case "alias": {
          return;
        }

        case "group": {
          window.gtag("event", "join_group", toGtagParams({ group_id: event.groupId, ...event.traits }));

          return;
        }

        case "identify": {
          // GA4 has no identify event — user_id is set once and rides along on later hits.
          if (event.userId !== undefined) {
            window.gtag("set", { user_id: event.userId });
          }

          return;
        }

        case "page": {
          if (options.trackPageViews === true) {
            // gtag.js attaches page_location/page_title from the live document itself, so
            // only the caller's extra props are forwarded.
            const { href: _href, ...extras } = event.props;

            window.gtag("event", "page_view", toGtagParams(extras));
          }

          return;
        }

        case "track": {
          if (!GA4_EVENT_NAME_PATTERN.test(event.name)) {
            console.warn(
              `[tracking] "${name}" dropped event "${event.name}" — GA4 event names must start with a letter and contain only letters, digits, or underscores (max 40 chars)`,
            );

            return;
          }

          window.gtag("event", event.name, toGtagParams(event.props));
        }
      }
    },
  };
}
