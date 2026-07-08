import type { InitialConsent } from "#/lib/consent";
import { CONSENT_POLICY_VERSION, CONSENT_STORAGE_KEY, resolveInitialConsent } from "#/lib/consent";
import { GA_MEASUREMENT_ID } from "#/lib/google-tag-loader";
import { INITIAL_CONSENT_COOKIE_NAME } from "#/lib/initial-consent-cookie";

/** Prefers `middleware.ts`'s per-visitor cookie over the static build's fallback. */
export function buildInitialConsentBootstrapScript(fallback: InitialConsent): string {
  return `
    (function () {
      var fallback = ${JSON.stringify(fallback)};
      var match = document.cookie.match(/(?:^|; )${INITIAL_CONSENT_COOKIE_NAME}=([^;]*)/);
      var resolved = fallback;
      if (match) {
        try {
          resolved = JSON.parse(decodeURIComponent(match[1]));
        } catch (e) {}
      }
      window.__INITIAL_CONSENT__ = resolved;
    })();
  `;
}

/**
 * Consent Mode v2 default + gtag.js config, in *basic* mode: the visitor's stored
 * decision must win over the region default *here*, and gtag.js itself is only fetched
 * when the effective consent grants analytics — a denied visitor's browser never pings
 * Google at all. A runtime grant loads the tag via `loadGoogleTagScript()` instead. The
 * ads signals follow the per-category decision generically, but this site never requests
 * the `ads` purpose, so they stay denied in practice.
 */
export function buildGtagBootstrapScript(gaMeasurementId: string): string {
  // The record read here is `@codefast/tracking`'s ConsentRecord, stored as plain JSON
  // by createLocalStorageConsentStorage under CONSENT_STORAGE_KEY.
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    var storedConsent = null;
    try {
      var record = JSON.parse(window.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)}));
      if (record && record.policyVersion === ${JSON.stringify(CONSENT_POLICY_VERSION)} && record.decision
          && typeof record.decision.ads === "boolean" && typeof record.decision.analytics === "boolean") {
        storedConsent = record.decision;
      }
    } catch (e) {}
    var consent = storedConsent || window.__INITIAL_CONSENT__.defaultConsent;
    gtag("consent", "default", {
      ad_personalization: consent.ads ? "granted" : "denied",
      ad_storage: consent.ads ? "granted" : "denied",
      ad_user_data: consent.ads ? "granted" : "denied",
      analytics_storage: consent.analytics ? "granted" : "denied",
    });
    if (consent.analytics) {
      gtag("js", new Date());
      gtag("config", "${gaMeasurementId}");
      var gtagScript = document.createElement("script");
      gtagScript.async = true;
      gtagScript.src = "https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}";
      document.head.appendChild(gtagScript);
    }
  `;
}

/**
 * Bootstraps `window.__INITIAL_CONSENT__` unconditionally (so `<ConsentGate />` always
 * has a value) and, when `GA_MEASUREMENT_ID` is configured, the Consent Mode default —
 * the bootstrap itself decides whether gtag.js may load (see `buildGtagBootstrapScript`).
 */
export function GoogleTag() {
  const initialConsent = resolveInitialConsent();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: buildInitialConsentBootstrapScript(initialConsent) }}
        suppressHydrationWarning
      />
      {GA_MEASUREMENT_ID ? (
        <script
          dangerouslySetInnerHTML={{ __html: buildGtagBootstrapScript(GA_MEASUREMENT_ID) }}
          suppressHydrationWarning
        />
      ) : null}
    </>
  );
}
