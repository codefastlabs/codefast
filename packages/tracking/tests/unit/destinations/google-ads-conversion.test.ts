import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createGoogleAdsConversionDestination } from "#/destinations/google-ads-conversion";

type GtagFunction = (...args: Array<unknown>) => void;

describe("createGoogleAdsConversionDestination", () => {
  let gtag: ReturnType<typeof vi.fn<GtagFunction>>;

  beforeEach(() => {
    gtag = vi.fn<GtagFunction>();
    window.gtag = gtag;
  });

  afterEach(() => {
    delete window.gtag;
  });

  it("fires a conversion for a mapped event, with value/currency/transaction_id from toParams", () => {
    const destination = createGoogleAdsConversionDestination({
      conversions: {
        order_completed: {
          sendTo: "AW-123456789/AbC-D_efG-h1234",
          toParams: (props) => ({
            currency: props.currency as string,
            transactionId: props.orderId as string,
            value: props.total as number,
          }),
        },
      },
    });

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e1",
      name: "order_completed",
      owner: "client",
      props: { currency: "USD", orderId: "order-1", total: 42 },
      timestamp: 0,
    });

    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      currency: "USD",
      send_to: "AW-123456789/AbC-D_efG-h1234",
      transaction_id: "order-1",
      value: 42,
    });
  });

  it("fires a valueless conversion when no toParams is given", () => {
    const destination = createGoogleAdsConversionDestination({
      conversions: { signed_up: { sendTo: "AW-123456789/AbC-D_efG-h1234" } },
    });

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e2",
      name: "signed_up",
      owner: "client",
      props: {},
      timestamp: 0,
    });

    expect(gtag).toHaveBeenCalledWith("event", "conversion", { send_to: "AW-123456789/AbC-D_efG-h1234" });
  });

  it("omits fields toParams doesn't return instead of forwarding undefined", () => {
    const destination = createGoogleAdsConversionDestination({
      conversions: {
        order_completed: {
          sendTo: "AW-123456789/AbC-D_efG-h1234",
          toParams: (props) => ({ value: props.total as number }),
        },
      },
    });

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e3",
      name: "order_completed",
      owner: "client",
      props: { total: 10 },
      timestamp: 0,
    });

    expect(gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-123456789/AbC-D_efG-h1234",
      value: 10,
    });
  });

  it("ignores events with no matching conversion mapping", () => {
    const destination = createGoogleAdsConversionDestination({
      conversions: { order_completed: { sendTo: "AW-123456789/AbC-D_efG-h1234" } },
    });

    void destination.send({
      anonymousId: "anon-1",
      eventId: "e4",
      name: "button_clicked",
      owner: "client",
      props: {},
      timestamp: 0,
    });

    expect(gtag).not.toHaveBeenCalled();
  });

  it("does nothing when window.gtag is not available", () => {
    delete window.gtag;

    const destination = createGoogleAdsConversionDestination({
      conversions: { order_completed: { sendTo: "AW-123456789/AbC-D_efG-h1234" } },
    });

    expect(() => {
      void destination.send({
        anonymousId: "anon-1",
        eventId: "e5",
        name: "order_completed",
        owner: "client",
        props: {},
        timestamp: 0,
      });
    }).not.toThrow();

    expect(gtag).not.toHaveBeenCalled();
  });

  it("uses the given destination name", () => {
    expect(createGoogleAdsConversionDestination({ conversions: {}, name: "ads" }).name).toBe("ads");
  });

  it("defaults the destination name to google-ads-conversion", () => {
    expect(createGoogleAdsConversionDestination({ conversions: {} }).name).toBe("google-ads-conversion");
  });
});
