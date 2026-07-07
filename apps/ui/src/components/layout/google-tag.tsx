import type { InitialConsent } from "#/lib/consent";
import { CONSENT_POLICY_VERSION, CONSENT_STORAGE_KEY, resolveInitialConsent } from "#/lib/consent";
import { INITIAL_CONSENT_COOKIE_NAME } from "#/lib/initial-consent-cookie";

const measurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID;

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
 * Consent Mode v2 default + gtag.js config. The visitor's stored decision must win over
 * the region default *here*, before `gtag("config")` fires the initial page_view — a
 * post-hydration `consent update` would be too late to stop (or unlock) that first hit.
 * The `ad_*` categories stay denied unconditionally — this site runs no ads, and the
 * analytics-only banner never asks the visitor about ads data sharing.
 */
export function buildGtagBootstrapScript(gaMeasurementId: string): string {
  // The record read here is `@codefast/tracking`'s ConsentRecord, stored as plain JSON
  // by createLocalStorageConsentStorage under CONSENT_STORAGE_KEY.
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    var storedDecision = null;
    try {
      var record = JSON.parse(window.localStorage.getItem(${JSON.stringify(CONSENT_STORAGE_KEY)}));
      if (record && record.policyVersion === ${JSON.stringify(CONSENT_POLICY_VERSION)} && (record.decision === "granted" || record.decision === "denied")) {
        storedDecision = record.decision;
      }
    } catch (e) {}
    var analyticsGranted = storedDecision ? storedDecision === "granted" : window.__INITIAL_CONSENT__.defaultGranted;
    gtag("consent", "default", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: analyticsGranted ? "granted" : "denied",
    });
    gtag("js", new Date());
    gtag("config", "${gaMeasurementId}");
  `;
}

/**
 * Bootstraps `window.__INITIAL_CONSENT__` unconditionally (so `<ConsentGate />` always
 * has a value) and, when `measurementId` is configured, gtag.js for GA4.
 */
export function GoogleTag() {
  const initialConsent = resolveInitialConsent();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: buildInitialConsentBootstrapScript(initialConsent) }}
        suppressHydrationWarning
      />
      {measurementId ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} />
          <script
            dangerouslySetInnerHTML={{ __html: buildGtagBootstrapScript(measurementId) }}
            suppressHydrationWarning
          />
        </>
      ) : null}
    </>
  );
}
