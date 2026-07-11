// Window.dataLayer is declared globally by @codefast/tracking's google-analytics module.
import { buildGtagConsentBootstrapScript } from "@codefast/tracking/destinations";
import { afterEach, describe, expect, it } from "vitest";

import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  STRICTEST_INITIAL_CONSENT,
} from "#/features/tracking/lib/consent";

/** The exact options `<GoogleTag />` passes to the package's `GtagConsentBootstrap`. */
function buildGtagBootstrapScript(gaMeasurementId: string): string {
  return buildGtagConsentBootstrapScript({
    consentStorageKey: CONSENT_STORAGE_KEY,
    defaultConsent: STRICTEST_INITIAL_CONSENT.defaultConsent,
    gaMeasurementId,
    policyVersion: CONSENT_POLICY_VERSION,
  });
}

/** Executes the exact source string `<GoogleTag />` inlines into the page, as the browser would. */
function runScript(script: string): void {
  // oxlint-disable-next-line no-implied-eval -- verifying the literal script text is valid, running JS, not eval'ing untrusted input
  new Function(script)();
}

describe("GoogleTag bootstrap script", () => {
  afterEach(() => {
    delete window.dataLayer;
    window.localStorage.removeItem(CONSENT_STORAGE_KEY);

    for (const script of document.querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]')) {
      script.remove();
    }
  });

  function consentDefaultParams(): Record<string, string> {
    const calls = (window.dataLayer ?? []) as Array<ArrayLike<unknown>>;

    return calls[0]?.[2] as Record<string, string>;
  }

  function gtagScriptElement(): HTMLScriptElement | null {
    return document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]');
  }

  it("advanced consent mode: bakes the strictest default, still loads and configures gtag.js", () => {
    runScript(buildGtagBootstrapScript("G-TEST123"));

    const calls = (window.dataLayer ?? []) as Array<ArrayLike<unknown>>;

    expect(Array.from(calls[0] ?? [])).toEqual([
      "consent",
      "default",
      {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "denied",
      },
    ]);
    expect(calls[1]?.[0]).toBe("js");
    expect(Array.from(calls[2] ?? [])).toEqual(["config", "G-TEST123"]);
    // consent default + js + config — tag loads for cookieless pings / modeling
    expect(window.dataLayer).toHaveLength(3);
    expect(gtagScriptElement()?.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  });

  it("prefers a stored grant over the baked strictest default (returning visitor)", () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        decision: { ads: false, analytics: true },
        policyVersion: CONSENT_POLICY_VERSION,
        timestamp: 0,
      }),
    );
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("granted");
    expect(consentDefaultParams().ad_storage).toBe("denied");
    expect(gtagScriptElement()).not.toBeNull();
  });

  it("keeps a stored denial denied — advanced mode still injects the tag", () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({
        decision: { ads: false, analytics: false },
        policyVersion: CONSENT_POLICY_VERSION,
        timestamp: 0,
      }),
    );
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
    expect(gtagScriptElement()).not.toBeNull();
  });

  it("ignores a decision recorded under an older policy version", () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ decision: { ads: false, analytics: true }, policyVersion: "0", timestamp: 0 }),
    );
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });

  it("ignores a legacy granted/denied string record and falls back to the strictest default", () => {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ decision: "granted", policyVersion: CONSENT_POLICY_VERSION, timestamp: 0 }),
    );
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });

  it("falls back to the strictest default when the stored record is corrupt", () => {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "not-json");
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });
});
