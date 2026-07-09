import { buildGtagConsentBootstrapScript } from "@codefast/tracking/destinations";
import { GtagConsentBootstrap } from "@codefast/tracking/react";

import type { InitialConsent } from "#/features/tracking/lib/consent";
import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  INITIAL_CONSENT_COOKIE_NAME,
  resolveInitialConsent,
} from "#/features/tracking/lib/consent";
import { GA_MEASUREMENT_ID } from "#/features/tracking/lib/google-tag-loader";

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
 * This site's gtag Consent Mode bootstrap — reads `window.__INITIAL_CONSENT__.defaultConsent`
 * (set by the script above) rather than a literal, since middleware personalizes it per
 * visitor even on statically prerendered pages.
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
 * has a value) and, when `GA_MEASUREMENT_ID` is configured, advanced Consent Mode via
 * `<GtagConsentBootstrap />` — consent default first, then always load gtag.js.
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
        <GtagConsentBootstrap
          consentStorageKey={CONSENT_STORAGE_KEY}
          defaultConsentExpression="window.__INITIAL_CONSENT__.defaultConsent"
          gaMeasurementId={GA_MEASUREMENT_ID}
          policyVersion={CONSENT_POLICY_VERSION}
        />
      ) : null}
    </>
  );
}
