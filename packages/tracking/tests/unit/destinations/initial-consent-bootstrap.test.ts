import { afterEach, describe, expect, it } from "vitest";

import { buildInitialConsentBootstrapScript } from "#/destinations/initial-consent-bootstrap";

declare global {
  interface Window {
    __INITIAL_CONSENT__?: unknown;
    __CUSTOM_CONSENT__?: unknown;
  }
}

function runScript(script: string): void {
  // oxlint-disable-next-line no-implied-eval -- verifying the literal script text is valid JS
  new Function(script)();
}

const FALLBACK = {
  defaultConsent: { ads: false, analytics: false },
  mode: "opt-in" as const,
  region: "other" as const,
};

describe("buildInitialConsentBootstrapScript", () => {
  afterEach(() => {
    document.cookie = "initial-consent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
    delete window.__INITIAL_CONSENT__;
    delete window.__CUSTOM_CONSENT__;
  });

  it("uses the fallback when no cookie is set", () => {
    runScript(buildInitialConsentBootstrapScript({ cookieName: "initial-consent", fallback: FALLBACK }));

    expect(window.__INITIAL_CONSENT__).toEqual(FALLBACK);
  });

  it("prefers the cookie over the fallback when present", () => {
    const fromCookie = {
      defaultConsent: { ads: false, analytics: true },
      mode: "opt-out" as const,
      region: "us" as const,
    };

    document.cookie = `initial-consent=${encodeURIComponent(JSON.stringify(fromCookie))}; path=/`;
    runScript(buildInitialConsentBootstrapScript({ cookieName: "initial-consent", fallback: FALLBACK }));

    expect(window.__INITIAL_CONSENT__).toEqual(fromCookie);
  });

  it("falls back when the cookie is corrupt", () => {
    document.cookie = "initial-consent=not-json; path=/";
    runScript(buildInitialConsentBootstrapScript({ cookieName: "initial-consent", fallback: FALLBACK }));

    expect(window.__INITIAL_CONSENT__).toEqual(FALLBACK);
  });

  it("writes to a custom window key when provided", () => {
    runScript(
      buildInitialConsentBootstrapScript({
        cookieName: "initial-consent",
        fallback: FALLBACK,
        windowKey: "__CUSTOM_CONSENT__",
      }),
    );

    expect(window.__CUSTOM_CONSENT__).toEqual(FALLBACK);
    expect(window.__INITIAL_CONSENT__).toBeUndefined();
  });
});
