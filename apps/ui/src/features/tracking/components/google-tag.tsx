import { buildGtagConsentBootstrapScript, buildInitialConsentBootstrapScript } from "@codefast/tracking/destinations";

import type { InitialConsent } from "#/features/tracking/lib/consent";
import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  INITIAL_CONSENT_COOKIE_NAME,
  resolveInitialConsent,
} from "#/features/tracking/lib/consent";
import { GA_MEASUREMENT_ID } from "#/features/tracking/lib/google-tag-loader";

/** Prefers `middleware.ts`'s per-visitor cookie over the static build's fallback. */
export function buildSiteInitialConsentBootstrapScript(fallback: InitialConsent): string {
  return buildInitialConsentBootstrapScript({
    cookieName: INITIAL_CONSENT_COOKIE_NAME,
    fallback,
  });
}

/**
 * This site's gtag Consent Mode bootstrap — reads `window.__INITIAL_CONSENT__.defaultConsent`
 * (set by the script above) rather than a literal, since middleware personalizes it per
 * visitor while the CDN-cached (ISR) HTML stays shared across visitors.
 */
export function buildGtagBootstrapScript(gaMeasurementId: string): string {
  return buildGtagConsentBootstrapScript({
    consentStorageKey: CONSENT_STORAGE_KEY,
    defaultConsentExpression: "window.__INITIAL_CONSENT__.defaultConsent",
    gaMeasurementId,
    policyVersion: CONSENT_POLICY_VERSION,
  });
}

/**
 * Bootstraps `window.__INITIAL_CONSENT__` unconditionally (so `<ConsentGate />` always
 * has a value) and, when `GA_MEASUREMENT_ID` is configured, advanced Consent Mode —
 * consent default first, then always load gtag.js. Both scripts render from the
 * builders above, so the unit tests exercise the exact source this component inlines.
 */
export function GoogleTag() {
  const initialConsent = resolveInitialConsent();

  return (
    <>
      <script
        dangerouslySetInnerHTML={{ __html: buildSiteInitialConsentBootstrapScript(initialConsent) }}
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
