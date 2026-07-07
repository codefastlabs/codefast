// Window.dataLayer is declared globally by @codefast/tracking's google-analytics module.
import { afterEach, describe, expect, it } from "vitest";

import { buildGtagBootstrapScript, buildInitialConsentBootstrapScript } from "#/components/layout/google-tag";
import type { InitialConsent } from "#/lib/consent";
import { CONSENT_POLICY_VERSION, CONSENT_STORAGE_KEY } from "#/lib/consent";
import { INITIAL_CONSENT_COOKIE_NAME } from "#/lib/initial-consent-cookie";

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
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);
  });

  function consentDefaultParams(): Record<string, string> {
    const calls = (window.dataLayer ?? []) as Array<ArrayLike<unknown>>;

    return calls[0]?.[2] as Record<string, string>;
  }

  it("grants analytics_storage only — ad_* stays denied on an ads-free site — and configures the measurement ID", () => {
    window.__INITIAL_CONSENT__ = { defaultGranted: true, mode: "opt-out", region: "us" };
    runScript(buildGtagBootstrapScript("G-TEST123"));

    const calls = (window.dataLayer ?? []) as Array<ArrayLike<unknown>>;

    expect(Array.from(calls[0] ?? [])).toEqual([
      "consent",
      "default",
      {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "granted",
      },
    ]);
    expect(calls[1]?.[0]).toBe("js");
    expect(Array.from(calls[2] ?? [])).toEqual(["config", "G-TEST123"]);
  });

  it("defaults everything to denied when window.__INITIAL_CONSENT__ says so", () => {
    window.__INITIAL_CONSENT__ = { defaultGranted: false, mode: "opt-in", region: "eu" };
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
    expect(consentDefaultParams().ad_storage).toBe("denied");
  });

  it("prefers a stored grant over a denied region default (returning opt-in visitor)", () => {
    window.__INITIAL_CONSENT__ = { defaultGranted: false, mode: "opt-in", region: "eu" };
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ decision: "granted", policyVersion: CONSENT_POLICY_VERSION, timestamp: 0 }),
    );
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("granted");
  });

  it("prefers a stored denial over a granted region default (opted-out visitor)", () => {
    window.__INITIAL_CONSENT__ = { defaultGranted: true, mode: "opt-out", region: "us" };
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ decision: "denied", policyVersion: CONSENT_POLICY_VERSION, timestamp: 0 }),
    );
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });

  it("ignores a decision recorded under an older policy version", () => {
    window.__INITIAL_CONSENT__ = { defaultGranted: false, mode: "opt-in", region: "eu" };
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ decision: "granted", policyVersion: "0", timestamp: 0 }),
    );
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });

  it("falls back to the region default when the stored record is corrupt", () => {
    window.__INITIAL_CONSENT__ = { defaultGranted: true, mode: "opt-out", region: "us" };
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "not-json");
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("granted");
  });
});
