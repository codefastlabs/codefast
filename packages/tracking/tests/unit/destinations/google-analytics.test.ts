import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  createGoogleAnalyticsDestination,
  setGoogleConsentDefault,
  updateGoogleConsent,
} from "#/destinations/google-analytics";

type GtagFunction = (...args: Array<unknown>) => void;

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
    expect(createGoogleAnalyticsDestination().deliver).toBe("immediate");
  });

  it("forwards the event name and allowed-type props to gtag('event', ...)", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "button_clicked",
      owner: "client",
      props: { count: 3, id: "cta", primary: true },
      timestamp: 0,
    });

    expect(gtag).toHaveBeenCalledWith("event", "button_clicked", { count: 3, id: "cta", primary: true });
  });

  it("stringifies props gtag.js can't accept (nested objects/arrays)", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e2",
      name: "order_completed",
      owner: "client",
      props: { items: ["a", "b"] },
      timestamp: 0,
    });

    expect(gtag).toHaveBeenCalledWith("event", "order_completed", { items: '["a","b"]' });
  });

  it("drops undefined and null props instead of forwarding them", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e3",
      name: "page_viewed",
      owner: "client",
      props: { referrer: undefined, url: null },
      timestamp: 0,
    });

    expect(gtag).toHaveBeenCalledWith("event", "page_viewed", {});
  });

  it("drops $page_viewed by default — gtag config + Enhanced Measurement already report page views", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e4",
      name: "$page_viewed",
      owner: "client",
      props: { href: "https://example.com/pricing", name: "/pricing" },
      timestamp: 0,
    });

    expect(gtag).not.toHaveBeenCalled();
  });

  it("maps $page_viewed to page_view (extras only) when trackPageViews is enabled", () => {
    const destination = createGoogleAnalyticsDestination({ trackPageViews: true });

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e5",
      name: "$page_viewed",
      owner: "client",
      props: { href: "https://example.com/pricing", name: "/pricing", referrer: "/home" },
      timestamp: 0,
    });

    // gtag.js attaches page_location/page_title from the live document itself.
    expect(gtag).toHaveBeenCalledWith("event", "page_view", { referrer: "/home" });
  });

  it("maps $identify to gtag('set', { user_id }) instead of an event", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e6",
      name: "$identify",
      owner: "client",
      props: { plan: "pro" },
      timestamp: 0,
      userId: "user-1",
    });

    expect(gtag).toHaveBeenCalledWith("set", { user_id: "user-1" });
    expect(gtag).not.toHaveBeenCalledWith("event", expect.anything(), expect.anything());
  });

  it("maps $group to GA4's recommended join_group event with group_id", () => {
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e7",
      name: "$group",
      owner: "client",
      props: { groupId: "acme", plan: "enterprise" },
      timestamp: 0,
    });

    expect(gtag).toHaveBeenCalledWith("event", "join_group", { group_id: "acme", plan: "enterprise" });
  });

  it("warns and drops event names GA4 would reject instead of sending them to nowhere", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const destination = createGoogleAnalyticsDestination();

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e8",
      name: "$custom_thing",
      owner: "client",
      props: {},
      timestamp: 0,
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
        props: {},
        timestamp: 0,
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

  it("grants analytics_storage only — the ad_* categories stay denied without includeAds", () => {
    setGoogleConsentDefault(true);

    expect(gtag).toHaveBeenCalledWith("consent", "default", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "granted",
    });
  });

  it("grants all four categories when includeAds is set", () => {
    setGoogleConsentDefault(true, { includeAds: true });

    expect(gtag).toHaveBeenCalledWith("consent", "default", {
      ad_personalization: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      analytics_storage: "granted",
    });
  });

  it("maps denied to all four categories", () => {
    setGoogleConsentDefault(false);

    expect(gtag).toHaveBeenCalledWith("consent", "default", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "denied",
    });
  });

  it("defines the gtag.js queueing stub itself so the default can precede the tag", () => {
    delete window.gtag;

    setGoogleConsentDefault(true);

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

  it("pushes an analytics-only consent update on grant", () => {
    updateGoogleConsent(true);

    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "granted",
    });
  });

  it("pushes a consent update with denied state", () => {
    updateGoogleConsent(false);

    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "denied",
    });
  });

  it("queues through the stub when gtag.js has not loaded yet", () => {
    delete window.gtag;

    updateGoogleConsent(true);

    expect(window.dataLayer).toHaveLength(1);
  });
});
