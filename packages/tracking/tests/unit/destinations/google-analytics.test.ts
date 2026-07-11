import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ConsentConfig } from "#/core/consent-config";
import {
  buildGtagConsentBootstrapScript,
  clearGoogleAnalyticsCookies,
  createGoogleAnalyticsDestination,
  ensureGtag,
  loadGtagScript,
  setGoogleAdsDataRedaction,
  setGoogleConsentDefault,
  setGoogleUrlPassthrough,
  updateGoogleConsent,
} from "#/destinations/google-analytics";

type GtagFunction = (...args: Array<unknown>) => void;

const BOOTSTRAP_CONFIG: ConsentConfig = { policyVersion: "1", requestedCategories: ["analytics"], storageKey: "k" };

describe("createGoogleAnalyticsDestination", () => {
  let gtag: ReturnType<typeof vi.fn<GtagFunction>>;

  beforeEach(() => {
    gtag = vi.fn<GtagFunction>();
    window.gtag = gtag as never;
  });

  afterEach(() => {
    delete window.gtag;
  });

  it("delivers immediately — gtag.js owns its own batching and unload transport", () => {
    expect(createGoogleAnalyticsDestination().delivery).toBe("immediate");
  });

  it("forwards the event name and allowed-type properties to gtag('event', ...)", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "button_clicked",
      owner: "client",
      properties: { count: 3, id: "cta", primary: true },
      timestamp: 0,
      type: "track",
    });

    expect(gtag).toHaveBeenCalledWith("event", "button_clicked", { count: 3, id: "cta", primary: true });
  });

  it("stringifies properties gtag.js can't accept (nested objects/arrays)", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e2",
      name: "order_completed",
      owner: "client",
      properties: { items: ["a", "b"] },
      timestamp: 0,
      type: "track",
    });

    expect(gtag).toHaveBeenCalledWith("event", "order_completed", { items: '["a","b"]' });
  });

  it("drops undefined and null properties instead of forwarding them", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e3",
      name: "page_viewed",
      owner: "client",
      properties: { referrer: undefined, url: null },
      timestamp: 0,
      type: "track",
    });

    expect(gtag).toHaveBeenCalledWith("event", "page_viewed", {});
  });

  it("drops page envelopes by default — gtag config + Enhanced Measurement already report page views", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e4",
      name: "/pricing",
      owner: "client",
      properties: { href: "https://example.com/pricing" },
      timestamp: 0,
      type: "page",
    });

    expect(gtag).not.toHaveBeenCalled();
  });

  it("maps page envelopes to page_view (extras only) when trackPageViews is enabled", () => {
    const destination = createGoogleAnalyticsDestination({ trackPageViews: true });

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e5",
      name: "/pricing",
      owner: "client",
      properties: { href: "https://example.com/pricing", referrer: "/home" },
      timestamp: 0,
      type: "page",
    });

    // gtag.js attaches page_location/page_title from the live document itself.
    expect(gtag).toHaveBeenCalledWith("event", "page_view", { referrer: "/home" });
  });

  it("maps identify to gtag('set', { user_id }) instead of an event", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e6",
      owner: "client",
      timestamp: 0,
      traits: { plan: "pro" },
      type: "identify",
      userId: "user-1",
    });

    expect(gtag).toHaveBeenCalledWith("set", { user_id: "user-1" });
    expect(gtag).not.toHaveBeenCalledWith("event", expect.anything(), expect.anything());
  });

  it("maps group to GA4's recommended join_group event with group_id", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e7",
      groupId: "acme",
      owner: "client",
      timestamp: 0,
      traits: { plan: "enterprise" },
      type: "group",
    });

    expect(gtag).toHaveBeenCalledWith("event", "join_group", { group_id: "acme", plan: "enterprise" });
  });

  it("drops alias — GA4 merges identity via user_id on later hits", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e10",
      owner: "client",
      previousId: "anon-0",
      timestamp: 0,
      type: "alias",
      userId: "user-1",
    });

    expect(gtag).not.toHaveBeenCalled();
  });

  it("warns and drops event names GA4 would reject instead of sending them to nowhere", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e8",
      name: "invalid-name",
      owner: "client",
      properties: {},
      timestamp: 0,
      type: "track",
    });

    expect(gtag).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("uses the given destination name", () => {
    expect(createGoogleAnalyticsDestination({ name: "ga4" }).name).toBe("ga4");
  });

  it("defaults the destination name to google-analytics", () => {
    expect(createGoogleAnalyticsDestination().name).toBe("google-analytics");
  });

  it("does nothing when window.gtag is not available", () => {
    delete window.gtag;

    const destination = createGoogleAnalyticsDestination();

    expect(() => {
      void destination.send({
        anonymousId: "anon-1",
        eventId: "e9",
        name: "button_clicked",
        owner: "client",
        properties: {},
        timestamp: 0,
        type: "track",
      });
    }).not.toThrow();

    expect(gtag).not.toHaveBeenCalled();
  });
});

describe("setGoogleConsentDefault", () => {
  let gtag: ReturnType<typeof vi.fn<GtagFunction>>;

  beforeEach(() => {
    gtag = vi.fn<GtagFunction>();
    window.gtag = gtag as never;
  });

  afterEach(() => {
    delete window.gtag;
    delete window.dataLayer;
  });

  it("maps an analytics-only grant to analytics_storage — the ad_* signals stay denied", () => {
    setGoogleConsentDefault({ ads: false, analytics: true });

    expect(gtag).toHaveBeenCalledWith("consent", "default", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "granted",
    });
  });

  it("maps an ads grant to all three ad_* signals together", () => {
    setGoogleConsentDefault({ ads: true, analytics: true });

    expect(gtag).toHaveBeenCalledWith("consent", "default", {
      ad_personalization: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      analytics_storage: "granted",
    });
  });

  it("maps an all-denied decision to all four signals denied", () => {
    setGoogleConsentDefault({ ads: false, analytics: false });

    expect(gtag).toHaveBeenCalledWith("consent", "default", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "denied",
    });
  });

  it("forwards wait_for_update and region so tags can hold hits for a stored decision", () => {
    setGoogleConsentDefault({ ads: false, analytics: false }, { region: ["ES", "VN"], waitForUpdateMs: 500 });

    expect(gtag).toHaveBeenCalledWith("consent", "default", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "denied",
      region: ["ES", "VN"],
      wait_for_update: 500,
    });
  });

  it("defines the gtag.js queueing stub itself so the default can precede the tag", () => {
    delete window.gtag;

    setGoogleConsentDefault({ ads: false, analytics: true });

    expect(typeof window.gtag).toBe("function");
    expect(window.dataLayer).toHaveLength(1);

    // gtag.js expects the live Arguments object, replayed in order once the tag boots.
    const queued = Array.from((window.dataLayer as Array<ArrayLike<unknown>>)[0]!);

    expect(queued).toEqual([
      "consent",
      "default",
      { ad_personalization: "denied", ad_storage: "denied", ad_user_data: "denied", analytics_storage: "granted" },
    ]);
  });
});

describe("updateGoogleConsent", () => {
  let gtag: ReturnType<typeof vi.fn<GtagFunction>>;

  beforeEach(() => {
    gtag = vi.fn<GtagFunction>();
    window.gtag = gtag as never;
  });

  afterEach(() => {
    delete window.gtag;
    delete window.dataLayer;
  });

  it("pushes the per-category decision as a consent update", () => {
    updateGoogleConsent({ ads: false, analytics: true });

    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "granted",
    });
  });

  it("pushes an all-denied consent update", () => {
    updateGoogleConsent({ ads: false, analytics: false });

    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "denied",
    });
  });

  it("queues through the stub when gtag.js has not loaded yet", () => {
    delete window.gtag;

    updateGoogleConsent({ ads: false, analytics: true });

    expect(window.dataLayer).toHaveLength(1);
  });
});

describe("Consent Mode privacy flags", () => {
  let gtag: ReturnType<typeof vi.fn<GtagFunction>>;

  beforeEach(() => {
    gtag = vi.fn<GtagFunction>();
    window.gtag = gtag as never;
  });

  afterEach(() => {
    delete window.gtag;
    delete window.dataLayer;
  });

  it("sets ads_data_redaction through gtag('set', ...)", () => {
    setGoogleAdsDataRedaction(true);

    expect(gtag).toHaveBeenCalledWith("set", "ads_data_redaction", true);
  });

  it("sets url_passthrough through gtag('set', ...)", () => {
    setGoogleUrlPassthrough(true);

    expect(gtag).toHaveBeenCalledWith("set", "url_passthrough", true);
  });
});

describe("buildGtagConsentBootstrapScript", () => {
  /** Executes the exact source string a consumer would inline into the page. */
  function runScript(script: string): void {
    // oxlint-disable-next-line no-implied-eval -- verifying the literal script text is valid, running JS, not eval'ing untrusted input
    new Function(script)();
  }

  function consentDefaultParams(): Record<string, unknown> {
    const calls = (window.dataLayer ?? []) as Array<ArrayLike<unknown>>;

    return calls[0]?.[2] as Record<string, unknown>;
  }

  function gtagScriptElement(): HTMLScriptElement | null {
    return document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]');
  }

  afterEach(() => {
    delete window.dataLayer;
    delete window.gtag;
    window.localStorage.clear();

    for (const script of document.querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]')) {
      script.remove();
    }
  });

  it("applies the literal defaultConsent and always loads gtag.js (advanced Consent Mode)", () => {
    const script = buildGtagConsentBootstrapScript({
      config: BOOTSTRAP_CONFIG,
      defaultConsent: { ads: false, analytics: true },
      gaMeasurementId: "G-TEST123",
    });

    runScript(script);

    expect(consentDefaultParams()).toEqual({
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "granted",
    });
    expect(gtagScriptElement()?.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  });

  it("still loads gtag.js when the default denies analytics (advanced Consent Mode)", () => {
    const script = buildGtagConsentBootstrapScript({
      config: BOOTSTRAP_CONFIG,
      defaultConsent: { ads: false, analytics: false },
      gaMeasurementId: "G-TEST123",
    });

    runScript(script);

    expect(consentDefaultParams().analytics_storage).toBe("denied");
    // consent default + js + config — tag loads for cookieless pings / modeling
    expect(window.dataLayer).toHaveLength(3);
    expect(gtagScriptElement()?.src).toBe("https://www.googletagmanager.com/gtag/js?id=G-TEST123");
  });

  it("prefers a stored decision over defaultConsent", () => {
    window.localStorage.setItem(
      "k",
      JSON.stringify({ decision: { ads: false, analytics: true }, policyVersion: "1", timestamp: 0 }),
    );

    const script = buildGtagConsentBootstrapScript({
      config: BOOTSTRAP_CONFIG,
      defaultConsent: { ads: false, analytics: false },
      gaMeasurementId: "G-TEST123",
    });

    runScript(script);

    expect(consentDefaultParams().analytics_storage).toBe("granted");
    expect(gtagScriptElement()).not.toBeNull();
  });

  it("ignores a stored decision recorded under a superseded policy version", () => {
    window.localStorage.setItem(
      "k",
      JSON.stringify({ decision: { ads: false, analytics: true }, policyVersion: "0", timestamp: 0 }),
    );

    const script = buildGtagConsentBootstrapScript({
      config: BOOTSTRAP_CONFIG,
      defaultConsent: { ads: false, analytics: false },
      gaMeasurementId: "G-TEST123",
    });

    runScript(script);

    expect(consentDefaultParams().analytics_storage).toBe("denied");
  });

  it("queues onto a custom dataLayerName and passes l= to gtag.js", () => {
    const script = buildGtagConsentBootstrapScript({
      config: BOOTSTRAP_CONFIG,
      dataLayerName: "appDataLayer",
      defaultConsent: { ads: false, analytics: true },
      gaMeasurementId: "G-TEST123",
    });

    runScript(script);

    const customLayer = (window as unknown as { appDataLayer: Array<ArrayLike<unknown>> }).appDataLayer;

    expect(customLayer).toHaveLength(3);
    expect(Array.from(customLayer[0]!)).toEqual([
      "consent",
      "default",
      {
        ad_personalization: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        analytics_storage: "granted",
      },
    ]);
    expect(gtagScriptElement()?.src).toContain("l=appDataLayer");

    Reflect.deleteProperty(window, "appDataLayer");
  });

  it("sets nonce on the injected gtag.js script when provided", () => {
    const script = buildGtagConsentBootstrapScript({
      config: BOOTSTRAP_CONFIG,
      defaultConsent: { ads: false, analytics: true },
      gaMeasurementId: "G-TEST123",
      nonce: "csp-nonce-1",
    });

    runScript(script);

    expect(gtagScriptElement()?.nonce).toBe("csp-nonce-1");
  });

  it("passes debug_mode on config when debugMode is true", () => {
    const script = buildGtagConsentBootstrapScript({
      config: BOOTSTRAP_CONFIG,
      debugMode: true,
      defaultConsent: { ads: false, analytics: true },
      gaMeasurementId: "G-TEST123",
    });

    runScript(script);

    const calls = (window.dataLayer ?? []) as Array<ArrayLike<unknown>>;
    const configCall = Array.from(calls[2]!);

    expect(configCall).toEqual(["config", "G-TEST123", { debug_mode: true }]);
  });
});

describe("clearGoogleAnalyticsCookies", () => {
  afterEach(() => {
    for (const name of ["_ga", "_ga_TEST123", "other"]) {
      document.cookie = `${name}=; path=/; max-age=0`;
      document.cookie = `${name}=; path=/; max-age=0; domain=.${globalThis.location.hostname}`;
    }
  });

  it("expires _ga and _ga_* cookies and leaves unrelated cookies alone", () => {
    document.cookie = "_ga=GA1.1.1; path=/";
    document.cookie = "_ga_TEST123=GS1.1.1; path=/";
    document.cookie = "other=keep; path=/";

    clearGoogleAnalyticsCookies();

    expect(document.cookie.includes("_ga=")).toBe(false);
    expect(document.cookie.includes("_ga_TEST123=")).toBe(false);
    expect(document.cookie.includes("other=keep")).toBe(true);
  });
});

describe("ensureGtag / loadGtagScript", () => {
  afterEach(() => {
    delete window.dataLayer;
    delete window.gtag;
    Reflect.deleteProperty(window, "appDataLayer");

    for (const script of document.querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]')) {
      script.remove();
    }
  });

  it("ensureGtag creates the named dataLayer and a gtag stub that pushes onto it", () => {
    const gtag = ensureGtag({ dataLayerName: "appDataLayer" });

    expect(gtag).toBeTypeOf("function");
    gtag?.("js", new Date());

    const layer = (window as unknown as { appDataLayer: Array<ArrayLike<unknown>> }).appDataLayer;

    expect(layer).toHaveLength(1);
    expect(Array.from(layer[0]!)[0]).toBe("js");
  });

  it("loadGtagScript queues config, injects gtag.js with nonce, and enables debug_mode", () => {
    loadGtagScript({
      dataLayerName: "appDataLayer",
      debugMode: true,
      gaMeasurementId: "G-TEST123",
      nonce: "csp-nonce-2",
    });

    const layer = (window as unknown as { appDataLayer: Array<ArrayLike<unknown>> }).appDataLayer;
    const configCall = Array.from(layer[1]!);
    const script = document.querySelector(
      'script[src^="https://www.googletagmanager.com/gtag/js"]',
    ) as HTMLScriptElement | null;

    expect(configCall).toEqual(["config", "G-TEST123", { debug_mode: true }]);
    expect(script?.src).toContain("id=G-TEST123");
    expect(script?.src).toContain("l=appDataLayer");
    expect(script?.nonce).toBe("csp-nonce-2");
  });

  it("loadGtagScript is idempotent — a second call does not append another script", () => {
    loadGtagScript({ gaMeasurementId: "G-TEST123" });
    loadGtagScript({ gaMeasurementId: "G-TEST123" });

    expect(document.querySelectorAll('script[src^="https://www.googletagmanager.com/gtag/js"]')).toHaveLength(1);
  });
});
