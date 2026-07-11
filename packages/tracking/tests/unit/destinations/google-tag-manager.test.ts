import { afterEach, describe, expect, it, vi } from "vitest";

import type { ConsentConfig } from "#/core/consent-config";
import {
  buildGtmConsentBootstrapScript,
  createGoogleTagManagerDestination,
  loadGtmScript,
} from "#/destinations/google-tag-manager";

const BOOTSTRAP_CONFIG: ConsentConfig = { policyVersion: "1", requestedCategories: ["analytics"], storageKey: "k" };

describe("createGoogleTagManagerDestination", () => {
  it("delivers immediately — GTM owns its own queue and transport", () => {
    expect(createGoogleTagManagerDestination().delivery).toBe("immediate");
  });

  it("pushes track envelopes as { event, …properties } onto the dataLayer", () => {
    const dataLayer: Array<unknown> = [];

    (window as unknown as { dataLayer: Array<unknown> }).dataLayer = dataLayer;

    const destination = createGoogleTagManagerDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "button_clicked",
      owner: "client",
      properties: { id: "cta" },
      timestamp: 0,
      type: "track",
    });

    expect(dataLayer).toEqual([{ event: "button_clicked", id: "cta" }]);
  });

  it("uses a custom dataLayerName", () => {
    const appDataLayer: Array<unknown> = [];

    (window as unknown as { appDataLayer: Array<unknown> }).appDataLayer = appDataLayer;

    const destination = createGoogleTagManagerDestination({ dataLayerName: "appDataLayer" });

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "button_clicked",
      owner: "client",
      properties: {},
      timestamp: 0,
      type: "track",
    });

    expect(appDataLayer).toEqual([{ event: "button_clicked" }]);
    Reflect.deleteProperty(window, "appDataLayer");
  });

  it("drops page envelopes by default", () => {
    const dataLayer: Array<unknown> = [];

    (window as unknown as { dataLayer: Array<unknown> }).dataLayer = dataLayer;

    void createGoogleTagManagerDestination().send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "/pricing",
      owner: "client",
      properties: {},
      timestamp: 0,
      type: "page",
    });

    expect(dataLayer).toEqual([]);
  });

  it("maps identify to a dataLayer push carrying user_id", () => {
    const dataLayer: Array<unknown> = [];

    (window as unknown as { dataLayer: Array<unknown> }).dataLayer = dataLayer;

    void createGoogleTagManagerDestination().send({
      anonymousId: "anon-1",
      eventId: "e1",
      owner: "client",
      timestamp: 0,
      traits: {},
      type: "identify",
      userId: "user-1",
    });

    expect(dataLayer).toEqual([{ event: "identify", user_id: "user-1" }]);
  });

  it("warns and drops track names GA4 would reject instead of pushing them", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const dataLayer: Array<unknown> = [];

    (window as unknown as { dataLayer: Array<unknown> }).dataLayer = dataLayer;

    void createGoogleTagManagerDestination().send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "invalid-name",
      owner: "client",
      properties: {},
      timestamp: 0,
      type: "track",
    });

    expect(dataLayer).toEqual([]);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});

describe("buildGtmConsentBootstrapScript", () => {
  function runScript(script: string): void {
    // oxlint-disable-next-line no-implied-eval -- verifying the literal script text is valid
    new Function(script)();
  }

  function gtmScriptElement(): HTMLScriptElement | null {
    return document.querySelector('script[src*="googletagmanager.com/gtm.js"]');
  }

  afterEach(() => {
    delete window.dataLayer;
    delete window.gtag;
    window.localStorage.clear();

    for (const script of document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]')) {
      script.remove();
    }
  });

  it("applies consent default and always loads gtm.js (advanced Consent Mode)", () => {
    const script = buildGtmConsentBootstrapScript({
      config: BOOTSTRAP_CONFIG,
      defaultConsent: { ads: false, analytics: true },
      gtmId: "GTM-TEST",
    });

    runScript(script);

    expect(gtmScriptElement()?.src).toContain("id=GTM-TEST");
    expect(window.dataLayer?.some((entry) => (entry as { event?: string }).event === "gtm.js")).toBe(true);
  });

  it("still loads gtm.js when analytics is denied (advanced Consent Mode)", () => {
    const script = buildGtmConsentBootstrapScript({
      config: BOOTSTRAP_CONFIG,
      defaultConsent: { ads: false, analytics: false },
      gtmId: "GTM-TEST",
    });

    runScript(script);

    expect(gtmScriptElement()?.src).toContain("id=GTM-TEST");
    expect(window.dataLayer?.some((entry) => (entry as { event?: string }).event === "gtm.js")).toBe(true);
  });

  it("forwards auth/preview and nonce onto the injected script URL/element", () => {
    const script = buildGtmConsentBootstrapScript({
      auth: "auth-token",
      config: BOOTSTRAP_CONFIG,
      defaultConsent: { ads: false, analytics: true },
      gtmId: "GTM-TEST",
      nonce: "csp-nonce",
      preview: "env-1",
    });

    runScript(script);

    const element = gtmScriptElement();

    expect(element?.src).toContain("gtm_auth=auth-token");
    expect(element?.src).toContain("gtm_preview=env-1");
    expect(element?.nonce).toBe("csp-nonce");
  });
});

describe("loadGtmScript", () => {
  afterEach(() => {
    delete window.dataLayer;

    for (const script of document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]')) {
      script.remove();
    }
  });

  it("queues gtm.js start and injects the container script with nonce", () => {
    loadGtmScript({ gtmId: "GTM-TEST", nonce: "csp-nonce" });

    const script = document.querySelector('script[src*="googletagmanager.com/gtm.js"]') as HTMLScriptElement | null;

    expect(window.dataLayer?.[0]).toMatchObject({ event: "gtm.js" });
    expect(script?.src).toContain("id=GTM-TEST");
    expect(script?.nonce).toBe("csp-nonce");
  });

  it("is idempotent for the same script URL", () => {
    loadGtmScript({ gtmId: "GTM-TEST" });
    loadGtmScript({ gtmId: "GTM-TEST" });

    expect(document.querySelectorAll('script[src*="googletagmanager.com/gtm.js"]')).toHaveLength(1);
  });
});
