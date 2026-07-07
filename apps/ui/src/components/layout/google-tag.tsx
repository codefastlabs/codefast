import type { InitialConsent } from "#/lib/consent";
import { resolveInitialConsent } from "#/lib/consent";
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

/** Consent Mode v2 default + gtag.js config, reading the bootstrap's resolved value. */
export function buildGtagBootstrapScript(gaMeasurementId: string): string {
  return `
    window.dataLayer = window.dataLayer || [];
    function gtag(){window.dataLayer.push(arguments);}
    var state = window.__INITIAL_CONSENT__.defaultGranted ? "granted" : "denied";
    gtag("consent", "default", {
      ad_personalization: state,
      ad_storage: state,
      ad_user_data: state,
      analytics_storage: state,
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
