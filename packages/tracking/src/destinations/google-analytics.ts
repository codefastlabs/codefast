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
 * Both signatures share one `gtag` global, so they must live in a single overloaded type —
 * two separate `declare global` augmentations with different signatures for the same
 * property is a TS error, not a merge.
 */
type GtagFunction = {
  (command: "consent", action: "default" | "update", params: GoogleConsentParams): void;
  (command: "event", eventName: string, params?: Record<string, GtagPropertyValue>): void;
};

declare global {
  interface Window {
    gtag?: GtagFunction;
  }
}

function toGoogleConsentParams(granted: boolean): GoogleConsentParams {
  const state: GoogleConsentState = granted ? "granted" : "denied";

  return { ad_personalization: state, ad_storage: state, ad_user_data: state, analytics_storage: state };
}

/**
 * Google Consent Mode v2's "default" signal — call as early as possible (ideally inline,
 * before the gtag.js script tag itself loads) so GA4/Ads never fire a hit before the
 * visitor's region-resolved default is known. This package's consent model is a single
 * granted/denied decision (no per-purpose granularity), so `granted` maps to all four
 * Consent Mode categories at once.
 */
export function setGoogleConsentDefault(granted: boolean): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("consent", "default", toGoogleConsentParams(granted));
}

/**
 * Google Consent Mode v2's "update" signal — call from `useConsent`'s `onDecision`
 * callback whenever the visitor grants or revokes consent, so already-loaded GA4/Ads tags
 * pick up the change without a page reload.
 */
export function updateGoogleConsent(granted: boolean): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return;
  }

  window.gtag("consent", "update", toGoogleConsentParams(granted));
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

export interface GoogleAnalyticsDestinationOptions {
  name?: string;
}

/**
 * Forwards events to `window.gtag` — requires the standard gtag.js snippet (which defines
 * `window.gtag` and queues into `window.dataLayer` before the async script loads) plus a
 * `gtag('config', measurementId)` call, both mounted once by the app. Never rejects, so
 * this destination never triggers `EventQueue`'s retry path.
 */
export function createGoogleAnalyticsDestination(options: GoogleAnalyticsDestinationOptions = {}): Destination {
  const name = options.name ?? "google-analytics";

  return {
    name,
    send(event) {
      if (typeof window === "undefined" || typeof window.gtag !== "function") {
        return;
      }

      window.gtag("event", event.name, toGtagParams(event.props));
    },
  };
}
