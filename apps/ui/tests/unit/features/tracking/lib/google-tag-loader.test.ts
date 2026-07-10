// Window.dataLayer/window.gtag are declared globally by @codefast/tracking's google-analytics module.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

function gtagScriptElement(): HTMLScriptElement | null {
  return document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]');
}

async function importLoader(measurementId: string | undefined) {
  vi.resetModules();

  if (measurementId === undefined) {
    vi.stubEnv("VITE_GA4_MEASUREMENT_ID", undefined);
  } else {
    vi.stubEnv("VITE_GA4_MEASUREMENT_ID", measurementId);
  }

  return import("#/features/tracking/lib/google-tag-loader");
}

beforeEach(() => {
  delete window.dataLayer;
  delete window.gtag;
});

afterEach(() => {
  vi.unstubAllEnvs();
  gtagScriptElement()?.remove();
});

describe("loadGoogleTagScript", () => {
  it("queues js/config and appends the gtag.js script once", async () => {
    const { loadGoogleTagScript } = await importLoader("G-TEST123");

    loadGoogleTagScript();

    const calls = (window.dataLayer ?? []) as Array<ArrayLike<unknown>>;

    expect(calls[0]?.[0]).toBe("js");
    expect(Array.from(calls[1] ?? [])).toEqual(["config", "G-TEST123"]);
    expect(gtagScriptElement()?.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  });

  it("is idempotent — a second call adds nothing", async () => {
    const { loadGoogleTagScript } = await importLoader("G-TEST123");

    loadGoogleTagScript();
    loadGoogleTagScript();

    expect(window.dataLayer).toHaveLength(2);
    expect(document.querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]')).toHaveLength(1);
  });

  it("no-ops without a configured measurement id", async () => {
    const { loadGoogleTagScript } = await importLoader(undefined);

    loadGoogleTagScript();

    expect(window.dataLayer).toBeUndefined();
    expect(gtagScriptElement()).toBeNull();
  });

  it("reuses an existing gtag stub instead of clobbering it", async () => {
    const pushed: Array<IArguments> = [];

    window.dataLayer = [];
    window.gtag = function gtag() {
      // eslint-style rest params would break gtag.js — mirror the real stub shape
      pushed.push(arguments);
    } as NonNullable<Window["gtag"]>;

    const { loadGoogleTagScript } = await importLoader("G-TEST123");

    loadGoogleTagScript();

    expect(pushed).toHaveLength(2);
    expect(pushed[0]?.[0]).toBe("js");
  });
});
