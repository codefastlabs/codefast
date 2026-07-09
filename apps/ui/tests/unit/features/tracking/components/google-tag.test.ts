// Window.dataLayer is declared globally by @codefast/tracking's google-analytics module.
import { afterEach, describe, expect, it } from "vitest";

import {
  buildGtagBootstrapScript,
  buildSiteInitialConsentBootstrapScript,
} from "#/features/tracking/components/google-tag";
import type { InitialConsent } from "#/features/tracking/lib/consent";
import {
  CONSENT_POLICY_VERSION,
  CONSENT_STORAGE_KEY,
  INITIAL_CONSENT_COOKIE_NAME,
} from "#/features/tracking/lib/consent";

/** Executes the exact source string `<GoogleTag />` inlines into the page, as the browser would. */
function runScript(script: string): void {
  // oxlint-disable-next-line no-implied-eval -- verifying the literal script text is valid, running JS, not eval'ing untrusted input
  new Function(script)();
}

const FALLBACK: InitialConsent = {
  defaultConsent: { ads: false, analytics: false },
  mode: "opt-in",
  region: "other",
};

describe("buildSiteInitialConsentBootstrapScript", () => {
  afterEach(() => {
    document.cookie = `${INITIAL_CONSENT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
    delete window.__INITIAL_CONSENT__;
  });

  it("uses the fallback when middleware.ts hasn't set a cookie", () => {
    runScript(buildSiteInitialConsentBootstrapScript(FALLBACK));

    expect(window.__INITIAL_CONSENT__).toEqual(FALLBACK);
  });

  it("prefers the middleware cookie over the fallback when present", () => {
    const fromCookie: InitialConsent = {
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out",
      region: "us",
    };

    document.cookie = `${INITIAL_CONSENT_COOKIE_NAME}=${encodeURIComponent(JSON.stringify(fromCookie))}; path=/`;
    runScript(buildSiteInitialConsentBootstrapScript(FALLBACK));

    expect(window.__INITIAL_CONSENT__).toEqual(fromCookie);
  });

  it("falls back to the baked value when the cookie is corrupt", () => {
    document.cookie = `${INITIAL_CONSENT_COOKIE_NAME}=not-json; path=/`;
    runScript(buildSiteInitialConsentBootstrapScript(FALLBACK));

    expect(window.__INITIAL_CONSENT__).toEqual(FALLBACK);
  });
});

describe("buildGtagBootstrapScript", () => {
  afterEach(() => {
    delete window.__INITIAL_CONSENT__;
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

  it("grants analytics_storage only — ad_* stays denied on an ads-free site — and loads + configures the tag", () => {
    window.__INITIAL_CONSENT__ = { defaultConsent: { ads: false, analytics: true }, mode: "opt-out", region: "us" };
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
    expect(gtagScriptElement()?.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  });

  it("advanced consent mode: still loads and configures gtag.js while consent is denied", () => {
    window.__INITIAL_CONSENT__ = { defaultConsent: { ads: false, analytics: false }, mode: "opt-in", region: "eu" };
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
    expect(consentDefaultParams().ad_storage).toBe("denied");
    // consent default + js + config — tag loads for cookieless pings / modeling
    expect(window.dataLayer).toHaveLength(3);
    expect(gtagScriptElement()?.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  });

  it("prefers a stored grant over a denied region default (returning opt-in visitor)", () => {
    window.__INITIAL_CONSENT__ = { defaultConsent: { ads: false, analytics: false }, mode: "opt-in", region: "eu" };
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

  it("prefers a stored denial over a granted region default (opted-out visitor)", () => {
    window.__INITIAL_CONSENT__ = { defaultConsent: { ads: false, analytics: true }, mode: "opt-out", region: "us" };
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
    // advanced mode still injects the tag; Consent Mode keeps storage denied
    expect(gtagScriptElement()).not.toBeNull();
  });

  it("ignores a decision recorded under an older policy version", () => {
    window.__INITIAL_CONSENT__ = { defaultConsent: { ads: false, analytics: false }, mode: "opt-in", region: "eu" };
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ decision: { ads: false, analytics: true }, policyVersion: "0", timestamp: 0 }),
    );
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });

  it("ignores a legacy granted/denied string record and falls back to the region default", () => {
    window.__INITIAL_CONSENT__ = { defaultConsent: { ads: false, analytics: false }, mode: "opt-in", region: "eu" };
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ decision: "granted", policyVersion: CONSENT_POLICY_VERSION, timestamp: 0 }),
    );
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });

  it("falls back to the region default when the stored record is corrupt", () => {
    window.__INITIAL_CONSENT__ = { defaultConsent: { ads: false, analytics: true }, mode: "opt-out", region: "us" };
    window.localStorage.setItem(CONSENT_STORAGE_KEY, "not-json");
    runScript(buildGtagBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("granted");
  });
});
