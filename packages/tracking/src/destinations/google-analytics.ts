import type { Destination } from "#/core/destination";

type GtagPropertyValue = boolean | number | string;

type GoogleConsentState = "denied" | "granted";

interface GoogleConsentParams {
  ad_personalization: GoogleConsentState;
  ad_storage: GoogleConsentState;
  ad_user_data: GoogleConsentState;
  analytics_storage: GoogleConsentState;
}

/**
 * All signatures share one `gtag` global, so they must live in a single overloaded type —
 * two separate `declare global` augmentations with different signatures for the same
 * property is a TS error, not a merge.
 */
type GtagFunction = {
  (command: "consent", action: "default" | "update", params: GoogleConsentParams): void;
  (command: "event", eventName: string, params?: Record<string, GtagPropertyValue>): void;
  (command: "set", params: Record<string, GtagPropertyValue>): void;
};

declare global {
  interface Window {
    dataLayer?: Array<unknown>;
    gtag?: GtagFunction;
  }
}

export interface GoogleConsentOptions {
  /**
   * Also grant the `ad_*` Consent Mode categories on a granted decision. Off by default:
   * an analytics-only banner never asked the visitor about ads data sharing, so granting
   * `ad_user_data`/`ad_personalization` from it would exceed the consent actually given.
   * Enable only for apps that run Google Ads and say so in their prompt.
   */
  includeAds?: boolean;
}

function toGoogleConsentParams(granted: boolean, options: GoogleConsentOptions): GoogleConsentParams {
  const analytics: GoogleConsentState = granted ? "granted" : "denied";
  const ads: GoogleConsentState = granted && options.includeAds === true ? "granted" : "denied";

  return { ad_personalization: ads, ad_storage: ads, ad_user_data: ads, analytics_storage: analytics };
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
 * Google Consent Mode v2's "default" signal — call before the gtag.js script tag loads
 * (this defines the queueing stub itself, so no snippet has to run first) with the
 * region-resolved default, so GA4/Ads never fire a hit ahead of it.
 */
export function setGoogleConsentDefault(granted: boolean, options: GoogleConsentOptions = {}): void {
  ensureGtag()?.("consent", "default", toGoogleConsentParams(granted, options));
}

/**
 * Google Consent Mode v2's "update" signal — call whenever the visitor's effective
 * consent changes (a banner decision, or one synced from another tab), so already-loaded
 * GA4/Ads tags pick up the change without a page reload.
 */
export function updateGoogleConsent(granted: boolean, options: GoogleConsentOptions = {}): void {
  ensureGtag()?.("consent", "update", toGoogleConsentParams(granted, options));
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

// GA4 rejects event names that don't start with a letter or exceed 40 chars — a `$`-prefixed
// or otherwise invalid name would be dropped at processing without any signal to the dev.
const GA4_EVENT_NAME_PATTERN = /^[A-Za-z][\w]{0,39}$/;

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
 * Forwards events to `window.gtag`, translating this package's `$`-prefixed built-ins to
 * GA4's vocabulary — `$identify` sets `user_id`, `$group` becomes the recommended
 * `join_group` event, `$page_viewed` maps to `page_view` (opt-in, see `trackPageViews`).
 * Requires the gtag.js snippet plus `gtag('config', measurementId)` mounted once by the
 * app. Marked `delivery: "immediate"` — gtag.js has its own batching and unload delivery,
 * so queueing in front of it only delays events and replays stale ones next session.
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

      if (event.name === "$identify") {
        // GA4 has no identify event — user_id is set once and rides along on later hits.
        if (event.userId !== undefined) {
          window.gtag("set", { user_id: event.userId });
        }

        return;
      }

      if (event.name === "$page_viewed") {
        if (options.trackPageViews === true) {
          // gtag.js attaches page_location/page_title from the live document itself, so
          // only the caller's extra props are forwarded.
          const { href: _href, name: _name, ...extras } = event.props;

          window.gtag("event", "page_view", toGtagParams(extras));
        }

        return;
      }

      if (event.name === "$group") {
        const { groupId, ...traits } = event.props;

        window.gtag("event", "join_group", toGtagParams({ group_id: groupId, ...traits }));

        return;
      }

      if (!GA4_EVENT_NAME_PATTERN.test(event.name)) {
        console.warn(
          `[tracking] "${name}" dropped event "${event.name}" — GA4 event names must start with a letter and contain only letters, digits, or underscores (max 40 chars)`,
        );

        return;
      }

      window.gtag("event", event.name, toGtagParams(event.props));
    },
  };
}
