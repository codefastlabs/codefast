import { afterEach, describe, expect, it } from "vitest";

import { buildGtagBootstrapScript, buildInitialConsentBootstrapScript } from "#/components/layout/google-tag";
import type { InitialConsent } from "#/lib/consent";
import { INITIAL_CONSENT_COOKIE_NAME } from "#/lib/initial-consent-cookie";

declare global {
  interface Window {
    dataLayer?: Array<Array<unknown>>;
  }
}

/** Executes the exact source string `<GoogleTag />` inlines into the page, as the browser would. */
function runScript(script: string): void {
  // oxlint-disable-next-line no-implied-eval -- verifying the literal script text is valid, running JS, not eval'ing untrusted input
  new Function(script)();
}

const FALLBACK: InitialConsent = { defaultGranted: false, mode: "opt-in", region: "other" };

describe("buildInitialConsentBootstrapScript", () => {
  afterEach(() => {
    document.cookie = `${INITIAL_CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    delete window.__INITIAL_CONSENT__;
  });

  it("uses the fallback when middleware.ts hasn't set a cookie", () => {
    runScript(buildInitialConsentBootstrapScript(FALLBACK));

    expect(window.__INITIAL_CONSENT__).toEqual(FALLBACK);
  });

  it("prefers the middleware cookie over the fallback when present", () => {
    const fromCookie: InitialConsent = { defaultGranted: true, mode: "opt-out", region: "us" };

    document.cookie = `${INITIAL_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(fromCookie))}; path=/`;
    runScript(buildInitialConsentBootstrapScript(FALLBACK));

    expect(window.__INITIAL_CONSENT__).toEqual(fromCookie);
  });

  it("falls back to the baked value when the cookie is corrupt", () => {
    document.cookie = `${INITIAL_CONSENT_COOKIE_NAME}=not-json; path=/`;
    runScript(buildInitialConsentBootstrapScript(FALLBACK));

    expect(window.__INITIAL_CONSENT__).toEqual(FALLBACK);
  });
});

describe("buildGtagBootstrapScript", () => {
  afterEach(() => {
    delete window.__INITIAL_CONSENT__;
    delete window.dataLayer;
  });

  it("defaults Consent Mode v2 to granted and configures the measurement ID", () => {
    window.__INITIAL_CONSENT__ = { defaultGranted: true, mode: "opt-out", region: "us" };
    runScript(buildGtagBootstrapScript("G-TEST123"));

    const calls = window.dataLayer ?? [];

    expect(Array.from(calls[0] ?? [])).toEqual([
      "consent",
      "default",
      {
        ad_personalization: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        analytics_storage: "granted",
      },
    ]);
    expect(calls[1]?.[0]).toBe("js");
    expect(Array.from(calls[2] ?? [])).toEqual(["config", "G-TEST123"]);
  });

  it("defaults Consent Mode v2 to denied when window.__INITIAL_CONSENT__ says so", () => {
    window.__INITIAL_CONSENT__ = { defaultGranted: false, mode: "opt-in", region: "eu" };
    runScript(buildGtagBootstrapScript("G-TEST123"));

    const [, , params] = window.dataLayer?.[0] ?? [];

    expect((params as Record<string, string>).ad_storage).toBe("denied");
  });
});
