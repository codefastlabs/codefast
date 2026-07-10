import type { ConsentDecision } from "#/core/consent";
import type { Destination } from "#/core/destination";
import { assertNever } from "#/core/tracked-event";
import {
  DEFAULT_DATA_LAYER_NAME,
  dataLayerOf,
  googleConsentBootstrapPreamble,
  resolveFallbackConsentExpression,
  warnUnlessGa4EventName,
} from "#/destinations/google-consent";
import { flattenEventProps, omitHref, toJoinGroupPayload } from "#/destinations/shared";

const DEFAULT_GTM_SCRIPT_URL = "https://www.googletagmanager.com/gtm.js";

function gtmScriptSrc(options: {
  auth?: string | undefined;
  dataLayerName: string;
  gtmId: string;
  gtmScriptUrl: string;
  preview?: string | undefined;
}): string {
  const url = new URL(options.gtmScriptUrl);

  url.searchParams.set("id", options.gtmId);

  if (options.dataLayerName !== DEFAULT_DATA_LAYER_NAME) {
    url.searchParams.set("l", options.dataLayerName);
  }

  if (options.auth !== undefined) {
    url.searchParams.set("gtm_auth", options.auth);
  }

  if (options.preview !== undefined) {
    url.searchParams.set("gtm_preview", options.preview);
    url.searchParams.set("gtm_cookies_win", "x");
  }

  return url.toString();
}

export interface LoadGtmScriptOptions {
  /** Environment snippet `gtm_auth` — pair with `preview`. */
  auth?: string | undefined;
  /** Name of the queue array on `window`. Defaults to `"dataLayer"`. */
  dataLayerName?: string | undefined;
  /** GTM container ID (e.g. `"GTM-XXXXXXX"`). */
  gtmId: string;
  /**
   * Script URL for server-side tagging / Google tag gateway. Defaults to
   * `https://www.googletagmanager.com/gtm.js`.
   */
  gtmScriptUrl?: string | undefined;
  /**
   * CSP nonce applied to the injected gtm.js `<script>` element. The app must also put
   * the same nonce on any inline bootstrap `<script>`.
   */
  nonce?: string | undefined;
  /** Environment snippet `gtm_preview` — pair with `auth`. */
  preview?: string | undefined;
}

/**
 * Loads gtm.js on demand — idempotent. Queues the standard `gtm.js` start event before
 * appending the script. Prefer `buildGtmConsentBootstrapScript` for page load (advanced
 * Consent Mode always injects the container after the default); use this when the
 * bootstrap did not run, or as an idempotent safety net after a runtime grant.
 */
export function loadGtmScript(options: LoadGtmScriptOptions): void {
  if (typeof document === "undefined") {
    return;
  }

  const dataLayerName = options.dataLayerName ?? DEFAULT_DATA_LAYER_NAME;
  const gtmScriptUrl = options.gtmScriptUrl ?? DEFAULT_GTM_SCRIPT_URL;
  const scriptSrc = gtmScriptSrc({
    auth: options.auth,
    dataLayerName,
    gtmId: options.gtmId,
    gtmScriptUrl,
    preview: options.preview,
  });

  if (document.querySelector(`script[src="${scriptSrc}"]`) !== null) {
    return;
  }

  const dataLayer = dataLayerOf(dataLayerName);

  if (dataLayer === undefined) {
    return;
  }

  dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");

  script.async = true;
  script.src = scriptSrc;

  if (options.nonce !== undefined) {
    script.nonce = options.nonce;
  }

  document.head.append(script);
}

export interface GoogleTagManagerDestinationOptions {
  /**
   * Name of the queue array on `window`. Defaults to `"dataLayer"` — must match the
   * bootstrap that loaded GTM on this page.
   */
  dataLayerName?: string | undefined;
  name?: string | undefined;
  /**
   * Forward `page` envelopes as a `page_view` dataLayer event. Off by default: GTM/GA4
   * tags usually already measure SPA history changes, so forwarding here would double-count.
   */
  trackPageViews?: boolean | undefined;
}

/**
 * Pushes catalog envelopes onto GTM's `dataLayer` as `{ event, …props }` objects —
 * `delivery: "immediate"` because GTM owns its own queue and transport. Requires the GTM
 * container (or a consent-gated bootstrap) to be mounted by the app; this destination only
 * enqueues. If GTM already loads GA4, do not also register `createGoogleAnalyticsDestination`
 * or events will double-fire.
 */
export function createGoogleTagManagerDestination(options: GoogleTagManagerDestinationOptions = {}): Destination {
  const dataLayerName = options.dataLayerName ?? DEFAULT_DATA_LAYER_NAME;
  const name = options.name ?? "google-tag-manager";

  return {
    delivery: "immediate",
    name,
    async send(event) {
      const dataLayer = dataLayerOf(dataLayerName);

      if (dataLayer === undefined) {
        return;
      }

      switch (event.type) {
        case "alias": {
          return;
        }

        case "group": {
          dataLayer.push({
            event: "join_group",
            ...flattenEventProps(toJoinGroupPayload(event), { allowNull: true }),
          });

          return;
        }

        case "identify": {
          if (event.userId !== undefined) {
            dataLayer.push({ event: "identify", user_id: event.userId });
          }

          return;
        }

        case "page": {
          if (options.trackPageViews === true) {
            dataLayer.push({
              event: "page_view",
              ...flattenEventProps(omitHref(event.props), { allowNull: true }),
            });
          }

          return;
        }

        case "track": {
          // Same GA4 name hygiene as the gtag destination — GTM often forwards these to GA4.
          if (!warnUnlessGa4EventName(name, event.name)) {
            return;
          }

          dataLayer.push({
            event: event.name,
            ...flattenEventProps(event.props, { allowNull: true }),
          });

          return;
        }

        default: {
          assertNever(event);
        }
      }
    },
  };
}

export interface GtmConsentBootstrapOptions {
  /** Environment snippet `gtm_auth` — pair with `preview` for GTM preview/debug containers. */
  auth?: string | undefined;
  /** localStorage key holding the package's `ConsentRecord` — must match `useConsent`'s `storage`. */
  consentStorageKey: string;
  /** Name of the queue array on `window`. Defaults to `"dataLayer"`. */
  dataLayerName?: string | undefined;
  /**
   * Consent to apply when nothing valid is stored yet. Embedded as a literal — for a
   * value only known via an earlier inline script, use `defaultConsentExpression` instead.
   */
  defaultConsent?: ConsentDecision | undefined;
  /**
   * A raw JS expression evaluating to the fallback `ConsentDecision`. Takes precedence
   * over `defaultConsent` when both are set; one of the two is required.
   */
  defaultConsentExpression?: string | undefined;
  /** GTM container ID (e.g. `"GTM-XXXXXXX"`). */
  gtmId: string;
  /**
   * Script URL for server-side tagging / Google tag gateway. Defaults to
   * `https://www.googletagmanager.com/gtm.js`.
   */
  gtmScriptUrl?: string | undefined;
  /**
   * CSP nonce written onto the *injected* gtm.js `<script>` element inside the generated
   * source. The host `<script>` that embeds this string must receive the same nonce from
   * the app.
   */
  nonce?: string | undefined;
  /** Must match `useConsent`'s `policyVersion`. */
  policyVersion: string;
  /** Environment snippet `gtm_preview` — pair with `auth`. */
  preview?: string | undefined;
}

/**
 * Pre-hydration Consent Mode v2 default + always-on GTM load — advanced Consent Mode,
 * matching `buildGtagConsentBootstrapScript`: consent default first, then gtm.js even
 * when storage is denied (cookieless pings / modeling). Uses a temporary `gtag` stub to
 * issue the consent default (GTM's recommended pattern) before appending the container.
 */
export function buildGtmConsentBootstrapScript(options: GtmConsentBootstrapOptions): string {
  const {
    auth,
    consentStorageKey,
    dataLayerName = DEFAULT_DATA_LAYER_NAME,
    defaultConsent,
    defaultConsentExpression,
    gtmId,
    gtmScriptUrl = DEFAULT_GTM_SCRIPT_URL,
    nonce,
    policyVersion,
    preview,
  } = options;

  const scriptUrl = gtmScriptSrc({ auth, dataLayerName, gtmId, gtmScriptUrl, preview });
  const dataLayerAccess = `window[${JSON.stringify(dataLayerName)}]`;
  const nonceAssignment = nonce === undefined ? "" : `gtmScript.nonce = ${JSON.stringify(nonce)};`;
  const preamble = googleConsentBootstrapPreamble({
    consentStorageKey,
    dataLayerName,
    fallbackConsentExpression: resolveFallbackConsentExpression(
      "buildGtmConsentBootstrapScript",
      defaultConsent,
      defaultConsentExpression,
    ),
    policyVersion,
  });

  // Advanced Consent Mode: consent default first, then always load the container.
  return `${preamble}
    ${dataLayerAccess}.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
    var gtmScript = document.createElement("script");
    gtmScript.async = true;
    gtmScript.src = ${JSON.stringify(scriptUrl)};
    ${nonceAssignment}
    document.head.appendChild(gtmScript);
  `;
}
