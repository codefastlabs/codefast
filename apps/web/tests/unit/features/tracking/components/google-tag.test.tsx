// Window.dataLayer is declared globally by @codefast/tracking's google-analytics module.
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { consentConfig } from "#/features/tracking/lib/consent";

/**
 * Renders the real `<GoogleTag />` and returns the inline script it mounts — the env id
 * is read at module scope, so each render stubs the env and re-imports the component.
 * jsdom never executes a script element created through the DOM, so rendering is inert.
 */
async function renderBootstrapScript(gaMeasurementId: string | undefined): Promise<string | undefined> {
  vi.resetModules();
  vi.stubEnv("VITE_GA4_MEASUREMENT_ID", gaMeasurementId ?? "");

  const { GoogleTag } = await import("#/features/tracking/components/google-tag");
  const { container } = render(<GoogleTag />);

  return container.querySelector("script")?.innerHTML;
}

/** Executes the exact source string `<GoogleTag />` inlines into the page, as the browser would. */
function runScript(script: string | undefined): void {
  expect(script).toBeDefined();
  // oxlint-disable-next-line no-implied-eval -- verifying the literal script text is valid, running JS, not eval'ing untrusted input
  new Function(script ?? "")();
}

describe("GoogleTag", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllEnvs();
    delete window.dataLayer;
    window.localStorage.removeItem(consentConfig.storageKey);

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

  it("renders nothing without a measurement id", async () => {
    expect(await renderBootstrapScript(undefined)).toBeUndefined();
  });

  it("advanced consent mode: bakes the strictest default, still loads and configures gtag.js", async () => {
    runScript(await renderBootstrapScript("G-TEST123"));

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

  it("prefers a stored grant over the baked strictest default (returning visitor)", async () => {
    window.localStorage.setItem(
      consentConfig.storageKey,
      JSON.stringify({
        decision: { ads: false, analytics: true },
        policyVersion: consentConfig.policyVersion,
        timestamp: 0,
      }),
    );
    runScript(await renderBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("granted");
    expect(consentDefaultParams().ad_storage).toBe("denied");
    expect(gtagScriptElement()).not.toBeNull();
  });

  it("keeps a stored denial denied — advanced mode still injects the tag", async () => {
    window.localStorage.setItem(
      consentConfig.storageKey,
      JSON.stringify({
        decision: { ads: false, analytics: false },
        policyVersion: consentConfig.policyVersion,
        timestamp: 0,
      }),
    );
    runScript(await renderBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
    expect(gtagScriptElement()).not.toBeNull();
  });

  it("ignores a decision recorded under an older policy version", async () => {
    window.localStorage.setItem(
      consentConfig.storageKey,
      JSON.stringify({ decision: { ads: false, analytics: true }, policyVersion: "0", timestamp: 0 }),
    );
    runScript(await renderBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });

  it("ignores a legacy granted/denied string record and falls back to the strictest default", async () => {
    window.localStorage.setItem(
      consentConfig.storageKey,
      JSON.stringify({ decision: "granted", policyVersion: consentConfig.policyVersion, timestamp: 0 }),
    );
    runScript(await renderBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });

  it("falls back to the strictest default when the stored record is corrupt", async () => {
    window.localStorage.setItem(consentConfig.storageKey, "not-json");
    runScript(await renderBootstrapScript("G-TEST123"));

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });
});
