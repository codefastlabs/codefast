import type { ConsentDecision } from "#/core/consent";
import type { ConsentConfig } from "#/core/consent-config";
import type { Destination } from "#/core/destination";
import type { GoogleConsentParams } from "#/destinations/google-consent";
import {
  buildGoogleConsentBootstrapPreamble,
  DEFAULT_DATA_LAYER_NAME,
  ensureDataLayer,
  toGoogleConsentParams,
  warnUnlessGa4EventName,
} from "#/destinations/google-consent";
import type { FlatPropertyValue } from "#/destinations/shared";
import { flattenEventProps } from "#/destinations/shared";

const GTAG_SCRIPT_BASE_URL = "https://www.googletagmanager.com/gtag/js";

type GtagPropertyValue = FlatPropertyValue;

/**
 * All signatures share one `gtag` global, so they must live in a single overloaded type —
 * two separate `declare global` augmentations with different signatures for the same
 * property is a TS error, not a merge.
 */
export type GtagFunction = {
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

function gtagScriptSrc(gaMeasurementId: string, dataLayerName: string): string {
  const url = new URL(GTAG_SCRIPT_BASE_URL);

  url.searchParams.set("id", gaMeasurementId);

  if (dataLayerName !== DEFAULT_DATA_LAYER_NAME) {
    // gtag.js's `l` param names the queue array — must match the stub that pushes into it.
    url.searchParams.set("l", dataLayerName);
  }

  return url.toString();
}

export interface EnsureGtagOptions {
  /**
   * Name of the queue array on `window`. Defaults to `"dataLayer"`. Must match across
   * `ensureGtag` / `loadGtagScript` / `buildGtagConsentBootstrapScript` for one page.
   */
  dataLayerName?: string | undefined;
}

/**
 * Ensures the standard gtag.js queueing stub exists so consent commands can be issued
 * before the tag itself loads — gtag.js replays the queue in order once it boots.
 */
export function ensureGtag(options: EnsureGtagOptions = {}): GtagFunction | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const dataLayerName = options.dataLayerName ?? DEFAULT_DATA_LAYER_NAME;

  ensureDataLayer(dataLayerName);

  // First stub wins — recreating would orphan commands already queued on another layer.
  // Callers must pass the same dataLayerName for every helper on the page.
  window.gtag ??= function gtag() {
    ensureDataLayer(dataLayerName)?.push(arguments);
  } as GtagFunction;

  return window.gtag;
}

export interface LoadGtagScriptOptions {
  /**
   * Name of the queue array on `window`. Defaults to `"dataLayer"` — must match the
   * bootstrap / `ensureGtag` call that already applied Consent Mode.
   */
  dataLayerName?: string | undefined;
  /** Forwarded as `gtag('config', id, { debug_mode: true })` for GA4 DebugView. */
  debugMode?: boolean | undefined;
  /** Google Analytics 4 Measurement ID (e.g. `"G-XXXXXXX"`). */
  gaMeasurementId: string;
  /**
   * CSP nonce applied to the injected gtag.js `<script>` element. The app must also put
   * the same nonce on any inline bootstrap `<script>` that runs `buildGtagConsentBootstrapScript`.
   */
  nonce?: string | undefined;
}

/**
 * Loads gtag.js on demand — idempotent (a second call is a no-op) and reuses any
 * existing `dataLayer`/`gtag` stub instead of clobbering it. Queues `js`/`config` before
 * appending the script tag, so gtag.js replays them under the caller's already-applied
 * consent state once it boots. Prefer `buildGtagConsentBootstrapScript` for page load
 * (advanced Consent Mode always injects the tag after the default); use this when the
 * bootstrap did not run, or as an idempotent safety net after a runtime grant.
 */
export function loadGtagScript(options: LoadGtagScriptOptions): void {
  if (typeof document === "undefined" || document.querySelector(`script[src^="${GTAG_SCRIPT_BASE_URL}"]`) !== null) {
    return;
  }

  const dataLayerName = options.dataLayerName ?? DEFAULT_DATA_LAYER_NAME;
  const gtag = ensureGtag({ dataLayerName });

  if (!gtag) {
    return;
  }

  gtag("js", new Date());

  if (options.debugMode === true) {
    gtag("config", options.gaMeasurementId, { debug_mode: true });
  } else {
    gtag("config", options.gaMeasurementId);
  }

  const script = document.createElement("script");

  script.async = true;
  script.src = gtagScriptSrc(options.gaMeasurementId, dataLayerName);

  if (options.nonce !== undefined) {
    script.nonce = options.nonce;
  }

  document.head.append(script);
}

/**
 * Expires Google's `_ga` / `_ga_*` cookies on `path=/` and the current host's parent
 * domain. Consent Mode stops using them once denied but never removes them — call from
 * a consent-withdrawal handler so a revoke does not leave identifier cookies behind.
 */
export function clearGoogleAnalyticsCookies(): void {
  if (typeof document === "undefined") {
    return;
  }

  const { hostname } = globalThis.location;

  for (const cookie of document.cookie.split("; ")) {
    const name = cookie.split("=")[0];

    if (name !== undefined && (name === "_ga" || name.startsWith("_ga_"))) {
      // GA sets its cookies on the broadest domain it can reach — expire both variants.
      document.cookie = `${name}=; path=/; max-age=0`;
      document.cookie = `${name}=; path=/; max-age=0; domain=.${hostname}`;
    }
  }
}

/**
 * Google Consent Mode v2's "update" signal — call whenever the visitor's effective
 * consent changes (a banner decision, or one synced from another tab), so already-loaded
 * GA4/Ads tags pick up the change without a page reload.
 *
 * @since 0.5.0-canary.4
 */
export function updateGoogleConsent(decision: ConsentDecision, options: EnsureGtagOptions = {}): void {
  ensureGtag(options)?.("consent", "update", toGoogleConsentParams(decision));
}

export interface GtagConsentBootstrapOptions {
  /** The same object `useConsent` receives — the bootstrap reads its `storageKey` and `policyVersion`. */
  config: ConsentConfig;
  /**
   * Name of the queue array on `window`. Defaults to `"dataLayer"`. Must match
   * `loadGtagScript` / `ensureGtag` if those run later on the same page.
   */
  dataLayerName?: string | undefined;
  /**
   * Consent to apply when nothing valid is stored yet. Embedded as a literal — bake the
   * strictest default on cached/shared HTML; upgrade after hydration via the private
   * server-fn lane + `updateGoogleConsent`.
   */
  defaultConsent: ConsentDecision;
  /** Forwarded as `gtag('config', id, { debug_mode: true })` after the consent default. */
  debugMode?: boolean | undefined;
  /** Google Analytics 4 Measurement ID (e.g. `"G-XXXXXXX"`). */
  gaMeasurementId: string;
  /**
   * CSP nonce written onto the *injected* gtag.js `<script>` element inside the generated
   * source. The host `<script dangerouslySetInnerHTML={…}>` that embeds this string must
   * receive the same nonce from the app (this helper only returns JS text, not a React node).
   */
  nonce?: string | undefined;
}

/**
 * Builds the literal JS source for a `<script dangerouslySetInnerHTML>` mounted in
 * `<head>`, before hydration: applies Consent Mode v2's default signal from the visitor's
 * stored decision (falling back to literal `defaultConsent` when none is stored yet),
 * then always loads gtag.js (advanced Consent Mode) so cookieless pings / modeling can
 * run even when storage is denied. A runtime decision change needs `updateGoogleConsent`
 * so the already-loaded tag picks up the grant/deny — this only covers the page-load
 * default + script injection.
 */
export function buildGtagConsentBootstrapScript(options: GtagConsentBootstrapOptions): string {
  const {
    config,
    dataLayerName = DEFAULT_DATA_LAYER_NAME,
    defaultConsent,
    debugMode,
    gaMeasurementId,
    nonce,
  } = options;

  const gtagScriptUrl = gtagScriptSrc(gaMeasurementId, dataLayerName);
  const configArgs =
    debugMode === true ? `${JSON.stringify(gaMeasurementId)}, { debug_mode: true }` : JSON.stringify(gaMeasurementId);
  const nonceAssignment = nonce === undefined ? "" : `gtagScript.nonce = ${JSON.stringify(nonce)};`;
  const preamble = buildGoogleConsentBootstrapPreamble({
    consentStorageKey: config.storageKey,
    dataLayerName,
    defaultConsent,
    policyVersion: config.policyVersion,
  });

  // Advanced Consent Mode: consent default first, then always load the tag (even when denied).
  return `${preamble}
    gtag("js", new Date());
    gtag("config", ${configArgs});
    var gtagScript = document.createElement("script");
    gtagScript.async = true;
    gtagScript.src = ${JSON.stringify(gtagScriptUrl)};
    ${nonceAssignment}
    document.head.appendChild(gtagScript);
  `;
}

/**
 * @since 0.5.0-canary.4
 */
export interface GoogleAnalyticsDestinationOptions {
  name?: string | undefined;
}

/**
 * Forwards catalog events to `window.gtag` as GA4 custom events. Page views are not this
 * destination's job: `gtag('config', ...)` sends the initial page_view and GA4's Enhanced
 * Measurement tracks SPA history changes. Requires the gtag.js snippet plus
 * `gtag('config', measurementId)` mounted once by the app (see the consent bootstrap) —
 * gtag.js owns its own batching and unload delivery.
 *
 * @since 0.5.0-canary.4
 */
export function createGoogleAnalyticsDestination(options: GoogleAnalyticsDestinationOptions = {}): Destination {
  const name = options.name ?? "google-analytics";

  return {
    name,
    // Synchronous today, but declared async so a throw here rejects the returned Promise
    // instead of escaping as a synchronous throw — matches Destination.send's contract.
    async send(event) {
      if (typeof window === "undefined" || typeof window.gtag !== "function") {
        return;
      }

      if (!warnUnlessGa4EventName(name, event.name)) {
        return;
      }

      window.gtag("event", event.name, flattenEventProps(event.properties));
    },
  };
}
