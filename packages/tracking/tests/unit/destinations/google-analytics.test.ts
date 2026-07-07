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
    window.gtag = gtag;
  });

  afterEach(() => {
    delete window.gtag;
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
        eventId: "e4",
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
    window.gtag = gtag;
  });

  afterEach(() => {
    delete window.gtag;
  });

  it("maps granted to all four Consent Mode v2 categories", () => {
    setGoogleConsentDefault(true);

    expect(gtag).toHaveBeenCalledWith("consent", "default", {
      ad_personalization: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
      analytics_storage: "granted",
    });
  });

  it("maps denied to all four Consent Mode v2 categories", () => {
    setGoogleConsentDefault(false);

    expect(gtag).toHaveBeenCalledWith("consent", "default", {
      ad_personalization: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      analytics_storage: "denied",
    });
  });

  it("does nothing when window.gtag is not available", () => {
    delete window.gtag;

    expect(() => {
      setGoogleConsentDefault(true);
    }).not.toThrow();

    expect(gtag).not.toHaveBeenCalled();
  });
});

describe("updateGoogleConsent", () => {
  let gtag: ReturnType<typeof vi.fn<GtagFunction>>;

  beforeEach(() => {
    gtag = vi.fn<GtagFunction>();
    window.gtag = gtag;
  });

  afterEach(() => {
    delete window.gtag;
  });

  it("pushes a consent update with granted state", () => {
    updateGoogleConsent(true);

    expect(gtag).toHaveBeenCalledWith("consent", "update", {
      ad_personalization: "granted",
      ad_storage: "granted",
      ad_user_data: "granted",
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

  it("does nothing when window.gtag is not available", () => {
    delete window.gtag;

    expect(() => {
      updateGoogleConsent(true);
    }).not.toThrow();

    expect(gtag).not.toHaveBeenCalled();
  });
});
